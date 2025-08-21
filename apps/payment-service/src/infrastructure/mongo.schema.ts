import { Schema } from 'mongoose';
import { PaymentStatus } from '../domain/payment.entity';

/**
 * Mongoose Schema for Payment documents.
 * Defines the structure and constraints for payment data in MongoDB.
 * Maps to the PaymentDocument interface in the repository.
 */
export const PaymentSchema = new Schema(
  {
    // Payment ID as the primary key
    _id: {
      type: String,
      required: true,
    },

    // User who is sending the payment
    fromUserId: {
      type: String,
      required: true,
      index: true,
    },

    // User who is receiving the payment
    toUserId: {
      type: String,
      required: true,
      index: true,
    },

    // Payment amount in cents to avoid floating point precision issues
    amountCents: {
      type: Number,
      required: true,
      min: 1,
    },

    // ISO 4217 currency code
    currencyCode: {
      type: String,
      required: true,
      enum: ['USD', 'EUR', 'CNY'],
      maxlength: 3,
    },

    // Current status of the payment
    status: {
      type: String,
      required: true,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },

    // Description of the payment
    description: {
      type: String,
      required: true,
      maxlength: 255,
    },

    // When the payment was created
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    // When the payment was processed (completed, failed, or refunded)
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false, // Don't automatically add _id field (we're using custom _id)
    versionKey: false, // Disable automatic __v versioning field
    collection: 'payments', // Explicitly set the collection name
  },
);

// Compound indexes for efficient payments history queries.

// This index is for finding payments by fromUserId and createdAt.
PaymentSchema.index({ fromUserId: 1, createdAt: -1 });

// This index is for finding payments by toUserId and createdAt.
PaymentSchema.index({ toUserId: 1, createdAt: -1 });

// This index is for finding payments between two users and sorted by createdAt.
PaymentSchema.index({ fromUserId: 1, toUserId: 1, createdAt: -1 });
