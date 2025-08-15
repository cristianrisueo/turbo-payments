import { randomUUID } from 'crypto';
import { Email } from './email';
import { Password } from './password';
import { Amount } from '../../../../packages/value-objects/amount';

/**
 * User Entity.
 * Represents a user in the system with email and password authentication.
 * Encapsulates user business logic and domain rules.
 */
export class User {
  private constructor(
    private readonly _id: string,
    private readonly _email: Email,
    private readonly _password: Password,
    private readonly _createdAt: Date,
    private _balance: Amount,
  ) {}

  /**
   * Factory method to create a new User from registration data.
   * @param {string} email - The user's email address.
   * @param {string} plainTextPassword - The user's plaintext password.
   * @returns {Promise<User>} A new User instance with hashed password.
   */
  static async createNewUser(
    email: string,
    plainTextPassword: string,
  ): Promise<User> {
    const id = randomUUID();
    const emailVO = Email.create(email);
    const passwordVO = await Password.createFromPlaintext(plainTextPassword);
    const newBalance = Amount.create(0);

    return new User(id, emailVO, passwordVO, new Date(), newBalance);
  }

  /**
   * Factory method to recreate a User from database data.
   * Used when loading users from database where password is already hashed.
   * @param {string} id - The user's ID.
   * @param {string} email - The user's email address.
   * @param {string} hashedPassword - The user's already hashed password.
   * @param {Date} createdAt - When the user was created.
   * @param {number} balanceCents - The user's balance in cents.
   * @returns {User} A recreated User instance from database data.
   */
  static createFromDatabase(
    id: string,
    email: string,
    hashedPassword: string,
    createdAt: Date,
    balanceCents: number,
  ): User {
    const emailVO = Email.create(email);
    const passwordVO = Password.createFromHash(hashedPassword);
    const balanceFromDB = Amount.create(balanceCents);

    return new User(id, emailVO, passwordVO, createdAt, balanceFromDB);
  }

  /**
   * Authenticates the user with a plaintext password.
   * @param {string} plainTextPassword - The password to verify.
   * @returns {Promise<boolean>} True if authentication succeeds, false otherwise.
   */
  async authenticate(plainTextPassword: string): Promise<boolean> {
    return await this._password.verify(plainTextPassword);
  }

  /**
   * Compares this user with another user.
   * Two users are considered equal if they have the same ID.
   * @param {User} other - The other user to compare with.
   * @returns {boolean} True if both users have the same ID, false otherwise.
   */
  equals(other: User): boolean {
    return this._id === other._id;
  }

  /**
   * Updates the user's balance and returns a new User instance.
   * Maintains immutability by creating a new User with the updated balance.
   * @param {Amount} newBalance - The new balance to set.
   * @returns {User} A new User instance with the updated balance.
   */
  updateBalance(newBalance: Amount): User {
    return new User(
      this._id,
      this._email,
      this._password,
      this._createdAt,
      newBalance,
    );
  }

  /**
   * Changes the user's password and returns a new User instance.
   * Maintains immutability by creating a new User with the updated password.
   * @param {string} newPlaintextPassword - The new plaintext password.
   * @returns {Promise<User>} A new User instance with the updated password.
   */
  async changePassword(newPlaintextPassword: string): Promise<User> {
    const newPasswordVO =
      await Password.createFromPlaintext(newPlaintextPassword);

    return new User(
      this._id,
      this._email,
      newPasswordVO,
      this._createdAt,
      this._balance,
    );
  }

  /**
   * Gets the user's ID. For direct access.
   * @returns {string} The user ID.
   */
  get id(): string {
    return this._id;
  }

  /**
   * Gets the user's email. For direct access.
   * @returns {Email} The user's email value object.
   */
  get email(): Email {
    return this._email;
  }

  /**
   * Gets the user's hashed password. For direct access.
   * @returns {Password} The user's password value object.
   */
  get password(): Password {
    return this._password;
  }

  /**
   * Gets when the user was created. For direct access.
   * @returns {Date} The user's creation date.
   */
  get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * Gets the user's balance. For direct access.
   * @returns {Amount} The user's balance value object.
   */
  get balance(): Amount {
    return this._balance;
  }

  /**
   * Converts to string representation. For framework compatibility.
   * @returns {string} A formatted string representation of the user.
   */
  toString(): string {
    return `User ${this._email.value} (ID: ${this._id}) - Balance: ${this._balance.toFormattedString()}`;
  }
}
