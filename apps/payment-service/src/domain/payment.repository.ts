import { Payment, PaymentStatus } from './payment.entity';
import { TransactionId } from './transactionId';

/**
 * Injection token for Payment Repository.
 * Used for dependency injection since interfaces don't exist at runtime.
 */
export const PAYMENT_REPOSITORY_TOKEN = 'PAYMENT_REPOSITORY_TOKEN';

/**
 * Payment Repository Interface.
 * Defines the contract for payment persistence operations.
 * Implementation details are handled by the infrastructure layer.
 */
export interface PaymentRepositoryInterface {
  /**
   * Saves a new payment to the repository.
   * @param {Payment} payment - The payment to save.
   * @returns {Promise<void>} Promise that resolves when payment is saved.
   * @throws {Error} If payment already exists or save operation fails.
   */
  save(payment: Payment): Promise<void>;

  /**
   * Finds a payment by its transaction ID.
   * @param {TransactionId} transactionId - The transaction ID to search for.
   * @returns {Promise<Payment | null>} The payment if found, null otherwise.
   */
  findById(transactionId: TransactionId): Promise<Payment | null>;

  /**
   * Finds all payments sent by a specific user.
   * @param {string} fromUserId - The sender user ID.
   * @returns {Promise<Payment[]>} Array of payments sent by the user.
   */
  findByFromUserId(fromUserId: string): Promise<Payment[]>;

  /**
   * Finds all payments received by a specific user.
   * @param {string} toUserId - The receiver user ID.
   * @returns {Promise<Payment[]>} Array of payments received by the user.
   */
  findByToUserId(toUserId: string): Promise<Payment[]>;

  /**
   * Finds all payments (sent and received) for a specific user.
   * @param {string} userId - The user ID.
   * @returns {Promise<Payment[]>} Array of all payments involving the user.
   */
  findByUserId(userId: string): Promise<Payment[]>;

  /**
   * Finds payments by status.
   * @param {PaymentStatus} status - The payment status to search for.
   * @returns {Promise<Payment[]>} Array of payments with the specified status.
   */
  findByStatus(status: PaymentStatus): Promise<Payment[]>;

  /**
   * Updates an existing payment in the repository.
   * @param {Payment} payment - The payment to update.
   * @returns {Promise<void>} Promise that resolves when payment is updated.
   * @throws {Error} If payment doesn't exist or update operation fails.
   */
  update(payment: Payment): Promise<void>;
}
