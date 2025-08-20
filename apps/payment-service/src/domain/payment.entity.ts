import { TransactionId } from './transactionId';
import { Currency } from './currency';
import { Amount } from '../../../../packages/value-objects/amount';

/**
 * Payment status enum.
 * Represents the various states a payment can be in.
 * Used to track the lifecycle of a payment transaction.
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

/**
 * Payment Entity.
 * Represents a payment transaction from our P2P payments system.
 * Encapsulates all payment-related business rules.
 */
export class Payment {
  private constructor(
    private readonly _id: TransactionId,
    private readonly _fromUserId: string,
    private readonly _toUserId: string,
    private readonly _amount: Amount,
    private readonly _currency: Currency,
    private _status: PaymentStatus,
    private readonly _description: string,
    private readonly _createdAt: Date,
    private _processedAt: Date | null = null,
  ) {}

  /**
   * Factory method to create a new Payment.
   * Validates input parameters and creates a new Payment instance.
   * This method will be used when creating a new P2P payment transaction.
   * @param {string} fromUserId - The ID of the user sending the payment
   * @param {string} toUserId - The ID of the user receiving the payment
   * @param {Amount} amount - The payment amount
   * @param {Currency} currency - The payment currency
   * @param {string} description - Payment description
   * @returns {Payment} A new Payment instance
   * @throws {Error} If validation fails
   */
  static createNew(
    fromUserId: string,
    toUserId: string,
    amount: Amount,
    currency: Currency,
    description: string,
  ): Payment {
    // Basic rule validations (not part of value objects).
    if (fromUserId.trim() === toUserId.trim()) {
      throw new Error('Cannot send payment to yourself');
    }

    if (amount.valueCents === 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    if (description.length > 255) {
      throw new Error('Payment description cannot exceed 255 characters');
    }

    // Generates a new transaction ID.
    const transactionId = TransactionId.generate();

    // Returns the new transaction.
    return new Payment(
      transactionId,
      fromUserId.trim(),
      toUserId.trim(),
      amount,
      currency,
      PaymentStatus.PENDING,
      description.trim(),
      new Date(),
      null,
    );
  }

  /**
   * Factory method to recreate a Payment from database data.
   * Creates a Payment instance from raw data retrieved from the database.
   * This method will be used when loading existing payments from DB.
   * @param {string} id - Transaction ID
   * @param {string} fromUserId - From User ID
   * @param {string} toUserId - To User ID
   * @param {number} amountCents - Amount in cents
   * @param {string} currencyCode - Currency code
   * @param {PaymentStatus} status - Payment status
   * @param {string} description - Payment description
   * @param {Date} createdAt - Creation date
   * @param {Date | null} processedAt - Processing date
   * @returns {Payment} Recreated Payment instance
   */
  static createFromDatabase(
    id: string,
    fromUserId: string,
    toUserId: string,
    amountCents: number,
    currencyCode: string,
    status: PaymentStatus,
    description: string,
    createdAt: Date,
    processedAt: Date | null = null,
  ): Payment {
    // Creates the transaction ID, amount and currency value objects (passing validations).
    const transactionId = TransactionId.create(id);
    const amount = Amount.create(amountCents);
    const currency = Currency.create(currencyCode);

    // Returns a new payment with whose values
    return new Payment(
      transactionId,
      fromUserId,
      toUserId,
      amount,
      currency,
      status,
      description,
      createdAt,
      processedAt,
    );
  }

  /**
   * Processes the payment.
   * Simply marks as processing if currently pending.
   * @throws {Error} If payment cannot be processed
   */
  process(): void {
    if (this._status !== PaymentStatus.PENDING) {
      throw new Error(`Cannot process payment with status: ${this._status}`);
    }

    this._status = PaymentStatus.PROCESSING;
  }

  /**
   * Completes the payment.
   * Simply marks as completed if currently processing and sets processed date.
   * @throws {Error} If payment cannot be completed
   */
  complete(): void {
    if (this._status !== PaymentStatus.PROCESSING) {
      throw new Error(`Cannot complete payment with status: ${this._status}`);
    }

    this._status = PaymentStatus.COMPLETED;
    this._processedAt = new Date();
  }

  /**
   * Marks the payment as failed only if not already completed or refunded
   * and the reason is provided.
   * Simply marks as failed and sets a new processed date.
   * @param {string} reason - The failure reason.
   * @throws {Error} If payment cannot be set to failed.
   */
  fail(reason: string): void {
    // Checks that the payment is not completed or refunded.
    if (
      this._status === PaymentStatus.COMPLETED ||
      this._status === PaymentStatus.REFUNDED
    ) {
      throw new Error(`Cannot fail payment with status: ${this._status}`);
    }

    // Checks that a reason has been provided.
    if (!reason || reason.trim().length === 0) {
      throw new Error('Failure reason is required');
    }

    // Updates the payment to failed.
    this._status = PaymentStatus.FAILED;
    this._processedAt = new Date();
  }

  /**
   * Refunds the payment.
   * Simply marks as refunded if currently completed.
   * @throws {Error} If payment cannot be refunded.
   */
  refund(): void {
    if (this._status !== PaymentStatus.COMPLETED) {
      throw new Error('Can only refund completed payments');
    }

    this._status = PaymentStatus.REFUNDED;
  }

  /**
   * Checks if the payment is successful.
   * @returns {boolean} True if payment status is completed.
   */
  isSuccessful(): boolean {
    return this._status === PaymentStatus.COMPLETED;
  }

  /**
   * Gets the transaction ID. For direct access.
   * @returns {TransactionId} The transaction ID
   */
  get id(): TransactionId {
    return this._id;
  }

  /**
   * Gets the sender user ID. For direct access.
   * @returns {string} The from user ID
   */
  get fromUserId(): string {
    return this._fromUserId;
  }

  /**
   * Gets the receiver user ID. For direct access.
   * @returns {string} The to user ID
   */
  get toUserId(): string {
    return this._toUserId;
  }

  /**
   * Gets the payment amount. For direct access.
   * @returns {Amount} The payment amount
   */
  get amount(): Amount {
    return this._amount;
  }

  /**
   * Gets the payment currency. For direct access.
   * @returns {Currency} The payment currency
   */
  get currency(): Currency {
    return this._currency;
  }

  /**
   * Gets the payment status. For direct access.
   * @returns {PaymentStatus} The payment status
   */
  get status(): PaymentStatus {
    return this._status;
  }

  /**
   * Gets the payment description. For direct access.
   * @returns {string} The payment description
   */
  get description(): string {
    return this._description;
  }

  /**
   * Gets the creation date. For direct access.
   * @returns {Date} The creation date
   */
  get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * Gets the processing date. For direct access.
   * Returns null if not processed yet (e.g., still pending).
   * @returns {Date | null} The processing date
   */
  get processedAt(): Date | null {
    return this._processedAt;
  }

  /**
   * Converts to string representation. For framework compatibility.
   * @returns {string} String representation of the payment
   */
  toString(): string {
    return `Payment ${this._id.value}: ${this._amount.toFormattedString()} ${this._currency.code} - ${this._status}`;
  }
}
