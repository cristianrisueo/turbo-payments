import { Injectable, Inject } from '@nestjs/common';
import { Payment } from '../domain/payment.entity';
import { Currency } from '../domain/currency';
import {
  PaymentRepositoryInterface,
  PAYMENT_REPOSITORY_TOKEN,
} from '../domain/payment.repository';
import { UserServiceClient } from '../infrastructure/userServiceClient';
import { Amount } from '../../../../packages/value-objects/amount';

/**
 * Request object for sending a payment.
 */
export interface SendPaymentRequest {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  currencyCode: string;
  description: string;
}

/**
 * Response object for sending a payment.
 */
export interface SendPaymentResponse {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: string;
  currency: string;
  status: string;
  description: string;
  createdAt: Date;
}

/**
 * Use case for sending a new P2P payment.
 * Handles the business logic for payment creation.
 * Validates input, verifies users exist, and coordinates domain objects.
 */
@Injectable()
export class SendPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_TOKEN)
    private readonly paymentRepository: PaymentRepositoryInterface,
    private readonly userServiceClient: UserServiceClient,
  ) {}

  /**
   * Sends a new P2P payment between users.
   * Validates that both users exist before creating the payment.
   * @param {SendPaymentRequest} paymentData - The payment request data.
   * @returns {Promise<SendPaymentResponse>} The created payment details.
   * @throws {Error} If payment creation fails or users don't exist.
   */
  async execute(paymentData: SendPaymentRequest): Promise<SendPaymentResponse> {
    try {
      // Validates that both sender and receiver users exist.
      const sender = await this.userServiceClient.getUserById(
        paymentData.fromUserId,
      );
      if (!sender) {
        throw new Error('Sender user not found');
      }

      const receiver = await this.userServiceClient.getUserById(
        paymentData.toUserId,
      );
      if (!receiver) {
        throw new Error('Receiver user not found');
      }

      // Creates the value objects (with their built-in validation).
      const amount = Amount.create(paymentData.amountCents);
      const currency = Currency.create(paymentData.currencyCode);

      // Creates a new payment (domain business rules will be validated here).
      const payment = Payment.createNew(
        paymentData.fromUserId,
        paymentData.toUserId,
        amount,
        currency,
        paymentData.description,
      );

      // Saves the payment to the repository.
      await this.paymentRepository.save(payment);

      // Returns the response.
      return {
        id: payment.id.value,
        fromUserId: payment.fromUserId,
        toUserId: payment.toUserId,
        amount: payment.amount.toFormattedString(),
        currency: payment.currency.code,
        status: payment.status,
        description: payment.description,
        createdAt: payment.createdAt,
      };
    } catch (error: unknown) {
      // Handle service communication errors and validation errors.
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Payment creation failed: ${errorMessage}`);
    }
  }
}
