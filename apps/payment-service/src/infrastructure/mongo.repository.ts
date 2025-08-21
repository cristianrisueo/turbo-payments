/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentStatus } from '../domain/payment.entity';
import { TransactionId } from '../domain/transactionId';
import { PaymentRepositoryInterface } from '../domain/payment.repository';

/**
 * MongoDB Payment Document Schema.
 * Represents how payment data is stored in MongoDB.
 */
export interface PaymentDocument {
  _id: string;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  currencyCode: string;
  status: PaymentStatus;
  description: string;
  createdAt: Date;
  processedAt: Date | null;
}

/**
 * MongoDB implementation of the Payment Repository.
 * Handles payment persistence operations using MongoDB.
 * Follows the repository pattern for clean architecture.
 */
@Injectable()
export class PaymentRepository implements PaymentRepositoryInterface {
  /**
   * Injects the Mongoose Payment model for MongoDB operations in the 'payments' database.
   * @param {Model<PaymentDocument>} paymentModel - The Mongoose model for Payment documents.
   */
  constructor(
    @InjectModel('Payment', 'payments')
    private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  /**
   * Saves a new payment to the MongoDB collection.
   * @param {Payment} payment - The payment to save.
   * @returns {Promise<void>} Promise that resolves when payment is saved.
   * @throws {Error} If payment already exists or save operation fails.
   */
  async save(payment: Payment): Promise<void> {
    try {
      const paymentDocument = new this.paymentModel({
        _id: payment.id.value,
        fromUserId: payment.fromUserId,
        toUserId: payment.toUserId,
        amountCents: payment.amount.valueCents,
        currencyCode: payment.currency.code,
        status: payment.status,
        description: payment.description,
        createdAt: payment.createdAt,
        processedAt: payment.processedAt,
      });

      await paymentDocument.save();
    } catch (error) {
      // Handles duplicate payment ID error
      if (error.code === 11000) {
        throw new Error('Payment with this ID already exists');
      }

      // Handles other errors
      throw new Error(
        `Failed to save payment: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Finds a payment by its transaction ID.
   * @param {TransactionId} transactionId - The transaction ID to search for.
   * @returns {Promise<Payment | null>} The payment if found, null otherwise.
   */
  async findById(transactionId: TransactionId): Promise<Payment | null> {
    const paymentDocument = await this.paymentModel
      .findById(transactionId.value)
      .exec();

    if (!paymentDocument) {
      return null;
    }

    return this.mapDocumentToPayment(paymentDocument);
  }

  /**
   * Finds all payments sent by a specific user.
   * @param {string} fromUserId - The sender user ID.
   * @returns {Promise<Payment[]>} Array of payments sent by the user.
   */
  async findByFromUserId(fromUserId: string): Promise<Payment[]> {
    const paymentDocuments = await this.paymentModel
      .find({ fromUserId })
      .sort({ createdAt: -1 })
      .exec();

    return paymentDocuments.map((doc) => this.mapDocumentToPayment(doc));
  }

  /**
   * Finds all payments received by a specific user.
   * @param {string} toUserId - The receiver user ID.
   * @returns {Promise<Payment[]>} Array of payments received by the user.
   */
  async findByToUserId(toUserId: string): Promise<Payment[]> {
    const paymentDocuments = await this.paymentModel
      .find({ toUserId })
      .sort({ createdAt: -1 })
      .exec();

    return paymentDocuments.map((doc) => this.mapDocumentToPayment(doc));
  }

  /**
   * Finds all payments (sent and received) for a specific user.
   * @param {string} userId - The user ID.
   * @returns {Promise<Payment[]>} Array of all payments involving the user.
   */
  async findByUserId(userId: string): Promise<Payment[]> {
    const paymentDocuments = await this.paymentModel
      .find({
        $or: [{ fromUserId: userId }, { toUserId: userId }],
      })
      .sort({ createdAt: -1 })
      .exec();

    return paymentDocuments.map((doc) => this.mapDocumentToPayment(doc));
  }

  /**
   * Finds payments by status.
   * @param {PaymentStatus} status - The payment status to search for.
   * @returns {Promise<Payment[]>} Array of payments with the specified status.
   */
  async findByStatus(status: PaymentStatus): Promise<Payment[]> {
    const paymentDocuments = await this.paymentModel
      .find({ status })
      .sort({ createdAt: -1 })
      .exec();

    return paymentDocuments.map((doc) => this.mapDocumentToPayment(doc));
  }

  /**
   * Updates an existing payment in the MongoDB collection.
   * @param {Payment} payment - The payment to update.
   * @returns {Promise<void>} Promise that resolves when payment is updated.
   * @throws {Error} If payment doesn't exist or update operation fails.
   */
  async update(payment: Payment): Promise<void> {
    const result = await this.paymentModel
      .updateOne(
        { _id: payment.id.value },
        {
          status: payment.status,
          processedAt: payment.processedAt,
        },
      )
      .exec();

    // Checks if the payment was found and updated
    if (result.matchedCount === 0) {
      throw new Error('Payment not found');
    }
  }

  /**
   * Helper function that maps a MongoDB document to a Payment domain entity.
   * Reconstructs the Payment entity from database data.
   * @param {PaymentDocument} document - The MongoDB document.
   * @returns {Payment} The reconstructed Payment entity.
   */
  private mapDocumentToPayment(document: PaymentDocument): Payment {
    return Payment.createFromDatabase(
      document._id,
      document.fromUserId,
      document.toUserId,
      document.amountCents,
      document.currencyCode,
      document.status,
      document.description,
      document.createdAt,
      document.processedAt,
    );
  }
}
