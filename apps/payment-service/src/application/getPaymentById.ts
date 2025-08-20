import { Injectable, Inject } from '@nestjs/common';
import { TransactionId } from '../domain/transactionId';
import {
  PaymentRepositoryInterface,
  PAYMENT_REPOSITORY_TOKEN,
} from '../domain/payment.repository';

/**
 * Request object for getting a payment by ID.
 */
export interface GetPaymentByIdRequest {
  transactionId: string;
}

/**
 * Response object for getting a payment by ID.
 */
export interface GetPaymentByIdResponse {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: string;
  currency: string;
  status: string;
  description: string;
  createdAt: Date;
  processedAt: Date | null;
}

/**
 * Use case for retrieving a payment by its transaction ID.
 * Handles the business logic for payment retrieval.
 * Validates transaction ID and returns payment details.
 */
@Injectable()
export class GetPaymentByIdUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_TOKEN)
    private readonly paymentRepository: PaymentRepositoryInterface,
  ) {}

  /**
   * Retrieves a payment by its transaction ID.
   * @param {GetPaymentByIdRequest} request - The request with transaction ID.
   * @returns {Promise<GetPaymentByIdResponse>} The payment data.
   * @throws {Error} If payment is not found.
   */
  async execute(
    request: GetPaymentByIdRequest,
  ): Promise<GetPaymentByIdResponse> {
    // Creates the transaction ID value object.
    const transactionId = TransactionId.create(request.transactionId);

    // Finds the payment by transaction ID. Throws error if not found.
    const payment = await this.paymentRepository.findById(transactionId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Returns the payment data.
    return {
      id: payment.id.value,
      fromUserId: payment.fromUserId,
      toUserId: payment.toUserId,
      amount: payment.amount.toFormattedString(),
      currency: payment.currency.code,
      status: payment.status,
      description: payment.description,
      createdAt: payment.createdAt,
      processedAt: payment.processedAt,
    };
  }
}
