/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../domain/user.entity';
import { Email } from '../domain/email';
import { Password } from '../domain/password';
import { Amount } from '../../../../packages/value-objects/amount';
import { UserRepositoryInterface } from '../domain/user.repository';

/**
 * MongoDB User's Document Schema.
 * Represents how user data is stored in MongoDB
 */
export interface UserDocument {
  _id: string;
  email: string;
  password: string;
  createdAt: Date;
  balance: number;
}

/**
 * MongoDB implementation of the User Repository.
 * Handles user persistence operations using MongoDB.
 */
@Injectable()
export class UserRepository implements UserRepositoryInterface {
  /**
   * Injects the Mongoose User model for MongoDB operations in the 'users' database.
   * @param {Model<UserDocument>} userModel - The Mongoose model for User documents.
   */
  constructor(
    @InjectModel('User', 'users')
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Saves a new user to the MongoDB collection.
   * @param {User} user - The user to save.
   * @returns {Promise<void>} Promise that resolves when user is saved.
   * @throws {Error} If user already exists or save operation fails.
   */
  async save(user: User): Promise<void> {
    try {
      const userDocument = new this.userModel({
        _id: user.id,
        email: user.email.value,
        password: user.password.value,
        createdAt: user.createdAt,
        balance: user.balance.valueCents,
      });

      await userDocument.save();
    } catch (error) {
      // Handles email already in use or other errors.
      if (error.code === 11000) {
        throw new Error('User with this email already exists');
      }

      throw new Error(
        `Failed to save user: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Finds a user by ID.
   * @param {string} id - The user ID to search for.
   * @returns {Promise<User | null>} The user if found, null otherwise.
   */
  async findById(id: string): Promise<User | null> {
    const userDocument = await this.userModel.findById(id).exec();

    if (!userDocument) {
      return null;
    }

    return this.mapDocumentToUser(userDocument);
  }

  /**
   * Finds a user by email address.
   * @param {Email} email - The email to search for.
   * @returns {Promise<User | null>} The user if found, null otherwise.
   */
  async findByEmail(email: Email): Promise<User | null> {
    const userDocument = await this.userModel
      .findOne({ email: email.value })
      .exec();

    if (!userDocument) {
      return null;
    }

    return this.mapDocumentToUser(userDocument);
  }

  /**
   * Updates a user's password.
   * @param {string} id - The user ID.
   * @param {Password} newPassword - The new hashed password.
   * @returns {Promise<void>} Promise that resolves when password is updated.
   */
  async updatePassword(id: string, newPassword: Password): Promise<void> {
    const result = await this.userModel
      .updateOne({ _id: id }, { password: newPassword.value })
      .exec();

    // Checks if the user was found and updated.
    if (result.matchedCount === 0) {
      throw new Error('User not found');
    }
  }

  /**
   * Updates a user's balance.
   * @param {string} id - The user ID.
   * @param {Amount} newBalance - The new balance amount object.
   * @returns {Promise<void>} Promise that resolves when the balance is updated.
   */
  async updateBalance(id: string, newBalance: Amount): Promise<void> {
    const result = await this.userModel
      .updateOne({ _id: id }, { balance: newBalance.valueCents })
      .exec();

    // Checks if the user was found and updated.
    if (result.matchedCount === 0) {
      throw new Error('User not found');
    }
  }

  /**
   * Deletes a user by their ID.
   * @param {string} id - The user ID.
   * @returns {Promise<void>} Promise that resolves when user is deleted.
   * @throws {Error} If user doesn't exist or delete operation fails.
   */
  async deleteById(id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();

    // Checks if the user was found and deleted.
    if (result.deletedCount === 0) {
      throw new Error('User not found');
    }
  }

  /**
   * Helper method that maps a MongoDB document to a User domain entity.
   * @param {UserDocument} document - The MongoDB document.
   * @returns {User} The reconstructed User entity.
   */
  private mapDocumentToUser(document: UserDocument): User {
    return User.createFromDatabase(
      document._id,
      document.email,
      document.password,
      document.createdAt,
      document.balance,
    );
  }
}
