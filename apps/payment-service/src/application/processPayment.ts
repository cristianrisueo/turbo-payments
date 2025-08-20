/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable, Inject } from '@nestjs/common';
import { TransactionId } from '../domain/transactionId';
import {
  PAYMENT_REPOSITORY_TOKEN,
  PaymentRepositoryInterface,
} from '../domain/payment.repository';
import { UserServiceClient } from '../infrastructure/userServiceClient';
import { Amount } from '../../../../packages/value-objects/amount';

/**
 * Request object for processing a payment.
 */
export interface ProcessPaymentRequest {
  transactionId: string;
}

/**
 * Response object for processing a payment.
 */
export interface ProcessPaymentResponse {
  id: string;
  status: string;
  processedAt: Date | null;
  message: string;
  senderNewBalance?: string;
  receiverNewBalance?: string;
}

/**
 * Use case for processing a payment transaction with balance logic.
 * Handles real P2P money transfer between users via microservice communication.
 * Validates balances and coordinates money movement across services.
 */
@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_TOKEN)
    private readonly paymentRepository: PaymentRepositoryInterface,
    private readonly userServiceClient: UserServiceClient,
  ) {}

  /**
   * Processes a pending payment with real balance checks and transfers.
   * Communicates with user-service via HTTP to validate users and update balances.
   * @param {ProcessPaymentRequest} processData - The processing request data.
   * @returns {Promise<ProcessPaymentResponse>} The processing result.
   * @throws {Error} If payment cannot be processed.
   */
  async execute(
    processData: ProcessPaymentRequest,
  ): Promise<ProcessPaymentResponse> {
    // Creates the transaction ID value object from the request data.
    const transactionId = TransactionId.create(processData.transactionId);

    // Finds the payment by transaction ID.
    const payment = await this.paymentRepository.findById(transactionId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Starts payment processing.
    payment.process();
    await this.paymentRepository.update(payment);

    try {
      // Gets sender via HTTP call to user-service and checks if it's found.
      const sender = await this.userServiceClient.getUserById(
        payment.fromUserId,
      );

      if (!sender) {
        payment.fail('Sender user not found');
        await this.paymentRepository.update(payment);

        return {
          id: payment.id.value,
          status: payment.status,
          processedAt: payment.processedAt,
          message: 'Payment failed: Sender user not found',
        };
      }

      // Gets receiver via HTTP call to user-service and checks if it's found.
      const receiver = await this.userServiceClient.getUserById(
        payment.toUserId,
      );

      if (!receiver) {
        payment.fail('Receiver user not found');
        await this.paymentRepository.update(payment);

        return {
          id: payment.id.value,
          status: payment.status,
          processedAt: payment.processedAt,
          message: 'Payment failed: Receiver user not found',
        };
      }

      // Checks if sender has sufficient balance to make the transaction.
      if (sender.balance < payment.amount.valueCents) {
        payment.fail('Insufficient balance');
        await this.paymentRepository.update(payment);

        return {
          id: payment.id.value,
          status: payment.status,
          processedAt: payment.processedAt,
          message: `Payment failed: Insufficient balance. Required: ${payment.amount.toFormattedString()}, Available: ${Amount.create(sender.balance).toFormattedString()}`,
        };
      }

      // Performs the money transfer via user-service API.
      const transferResult = await this.userServiceClient.transferBalance({
        fromUserId: payment.fromUserId,
        toUserId: payment.toUserId,
        amountCents: payment.amount.valueCents,
      });

      // Completes the payment.
      payment.complete();
      await this.paymentRepository.update(payment);

      // Returns success response with balance information.
      return {
        id: payment.id.value,
        status: payment.status,
        processedAt: payment.processedAt,
        message: `Payment completed successfully. Transferred ${payment.amount.toFormattedString()}`,
        senderNewBalance: Amount.create(
          transferResult.senderNewBalance,
        ).toFormattedString(),
        receiverNewBalance: Amount.create(
          transferResult.receiverNewBalance,
        ).toFormattedString(),
      };
    } catch (error) {
      // Handles service communication errors.
      payment.fail(`Service communication error: ${error.message}`);
      await this.paymentRepository.update(payment);

      return {
        id: payment.id.value,
        status: payment.status,
        processedAt: payment.processedAt,
        message: `Payment failed: ${error.message}`,
      };
    }
  }
}
