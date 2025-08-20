import { Injectable, Inject } from '@nestjs/common';
import {
  PaymentRepositoryInterface,
  PAYMENT_REPOSITORY_TOKEN,
} from '../domain/payment.repository';

/**
 * Request object for getting user's payment history.
 */
export interface GetUserPaymentHistoryRequest {
  userId: string;
}

/**
 * Payment's summary object.
 */
export interface PaymentSummary {
  id: string;
  type: 'SENT' | 'RECEIVED';
  otherUserId: string;
  amount: string;
  currency: string;
  status: string;
  description: string;
  createdAt: Date;
  processedAt: Date | null;
}

/**
 * Response object for getting user payment history.
 */
export interface GetUserPaymentHistoryResponse {
  userId: string;
  totalPayments: number;
  sentPayments: number;
  receivedPayments: number;
  payments: PaymentSummary[];
}

/**
 * Use case for retrieving a user's complete payment history.
 * Handles the business logic for payment history retrieval.
 * Combines sent and received payments into a unified history.
 */
@Injectable()
export class GetUserPaymentHistoryUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_TOKEN)
    private readonly paymentRepository: PaymentRepositoryInterface,
  ) {}

  /**
   * Retrieves complete payment history for a user.
   * @param {GetUserPaymentHistoryRequest} request - The request with user ID.
   * @returns {Promise<GetUserPaymentHistoryResponse>} The user's payment history.
   * @throws {Error} If user ID is invalid.
   */
  async execute(
    request: GetUserPaymentHistoryRequest,
  ): Promise<GetUserPaymentHistoryResponse> {
    // Validates the user ID received.
    if (
      !request.userId ||
      typeof request.userId !== 'string' ||
      request.userId.trim().length === 0
    ) {
      throw new Error('User ID is required');
    }

    const userId = request.userId.trim();

    // Gets all payments for the user (sent and received).
    const allPayments = await this.paymentRepository.findByUserId(userId);

    // Separates sent and received payments.
    const sentPayments = allPayments.filter(
      (payment) => payment.fromUserId === userId,
    );

    const receivedPayments = allPayments.filter(
      (payment) => payment.toUserId === userId,
    );

    // Maps payments to summary format and sorts by creation date (newest first)
    const paymentSummaries: PaymentSummary[] = allPayments
      .map((payment) => ({
        id: payment.id.value,
        type:
          payment.fromUserId === userId
            ? ('SENT' as const)
            : ('RECEIVED' as const),
        otherUserId:
          payment.fromUserId === userId ? payment.toUserId : payment.fromUserId,
        amount: payment.amount.toFormattedString(),
        currency: payment.currency.code,
        status: payment.status,
        description: payment.description,
        createdAt: payment.createdAt,
        processedAt: payment.processedAt,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Returns the complete payments history.
    return {
      userId,
      totalPayments: allPayments.length,
      sentPayments: sentPayments.length,
      receivedPayments: receivedPayments.length,
      payments: paymentSummaries,
    };
  }
}
