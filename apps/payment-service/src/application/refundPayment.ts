import { Injectable, Inject } from '@nestjs/common';
import { TransactionId } from '../domain/transactionId';
import {
  PAYMENT_REPOSITORY_TOKEN,
  PaymentRepositoryInterface,
} from '../domain/payment.repository';
import { UserServiceClient } from '../infrastructure/userServiceClient';
import { Amount } from '../../../../packages/value-objects/amount';

/**
 * Request object for refunding a payment.
 */
export interface RefundPaymentRequest {
  transactionId: string;
}

/**
 * Response object for refunding a payment.
 */
export interface RefundPaymentResponse {
  id: string;
  status: string;
  refundedAmount: string;
  message: string;
  senderNewBalance: string;
  receiverNewBalance: string;
}

/**
 * Use case for refunding a completed payment.
 * Handles the business logic for payment reversal and balance restoration.
 * Coordinates payment status change and money transfer reversal via microservice communication.
 */
@Injectable()
export class RefundPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_TOKEN)
    private readonly paymentRepository: PaymentRepositoryInterface,
    private readonly userServiceClient: UserServiceClient,
  ) {}

  /**
   * Refunds a completed payment and reverses the money transfer.
   * Communicates with user-service via HTTP to validate users and reverse balance transfer.
   * @param {RefundPaymentRequest} request - The refund request data.
   * @returns {Promise<RefundPaymentResponse>} The refund result.
   * @throws {Error} If payment cannot be refunded.
   */
  async execute(request: RefundPaymentRequest): Promise<RefundPaymentResponse> {
    // Creates the transaction ID value object.
    const transactionId = TransactionId.create(request.transactionId);

    // Finds the payment by transaction ID.
    const payment = await this.paymentRepository.findById(transactionId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Validates that payment can be refunded (domain business rule).
    // Error will be thrown if payment cannot be refunded (completed status required).
    payment.refund();

    try {
      // Gets original sender via HTTP call to user-service.
      const originalSender = await this.userServiceClient.getUserById(
        payment.fromUserId,
      );
      if (!originalSender) {
        throw new Error('Original sender user not found');
      }

      // Gets original receiver via HTTP call to user-service.
      const originalReceiver = await this.userServiceClient.getUserById(
        payment.toUserId,
      );
      if (!originalReceiver) {
        throw new Error('Original receiver user not found');
      }

      // Checks if receiver has sufficient balance for refund.
      if (originalReceiver.balance < payment.amount.valueCents) {
        throw new Error(
          `Refund failed: Receiver has insufficient balance. Required: ${payment.amount.toFormattedString()}, Available: ${Amount.create(originalReceiver.balance).toFormattedString()}`,
        );
      }

      // Reverses the money transfer via user-service API.
      // Original sender gets money back, original receiver loses money.
      const refundResult = await this.userServiceClient.transferBalance({
        fromUserId: payment.toUserId, // Reverse: from receiver
        toUserId: payment.fromUserId, // Reverse: to sender
        amountCents: payment.amount.valueCents,
      });

      // Updates the payment status to refunded in the database.
      await this.paymentRepository.update(payment);

      // Returns success response with balance information.
      return {
        id: payment.id.value,
        status: payment.status,
        refundedAmount: payment.amount.toFormattedString(),
        message: `Payment refunded successfully. Returned ${payment.amount.toFormattedString()}`,
        senderNewBalance: Amount.create(
          refundResult.receiverNewBalance,
        ).toFormattedString(), // Original sender is now receiver
        receiverNewBalance: Amount.create(
          refundResult.senderNewBalance,
        ).toFormattedString(), // Original receiver is now sender
      };
    } catch (error: unknown) {
      // Handles service communication errors.
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Refund failed: ${errorMessage}`);
    }
  }
}
