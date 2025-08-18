import { Schema } from 'mongoose';

/**
 * Mongoose schema for User collection.
 * Defines the structure and constraints for user documents in MongoDB.
 * Maps to the UserDocument interface in the repository.
 */
export const UserSchema = new Schema(
  {
    // User ID as the primary key
    _id: {
      type: String,
      required: true,
    },
    // User's unique email address
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // User's hashed password
    password: {
      type: String,
      required: true,
    },
    // User's creation timestamp
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // User's balance in cents
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    _id: false, // Disables automatic _id generation since we provide our own
    versionKey: false, // Disables __v version field
    collection: 'users', // Sets collection name explicitly
  },
);
