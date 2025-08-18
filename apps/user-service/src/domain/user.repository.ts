import { User } from './user.entity';
import { Email } from './email';
import { Password } from './password';
import { Amount } from '../../../../packages/value-objects/amount';

/**
 * Injection token for User Repository.
 * Used for dependency injection since interfaces don't exist at runtime.
 */
export const USER_REPOSITORY_TOKEN = 'USER_REPOSITORY_TOKEN';

/**
 * User Repository Interface.
 * Defines the contract for user persistence operations.
 * Implementation details are handled by infrastructure layer.
 */
export interface UserRepositoryInterface {
  /**
   * Saves a new user to the repository.
   * @param {User} user - The user to save.
   * @returns {Promise<void>} Promise that resolves when user is saved.
   * @throws {Error} If user already exists or save operation fails.
   */
  save(user: User): Promise<void>;

  /**
   * Finds a user by ID.
   * @param {string} id - The user ID to search for.
   * @returns {Promise<User | null>} The user if found, null otherwise.
   */
  findById(id: string): Promise<User | null>;

  /**
   * Finds a user by email address.
   * @param {Email} email - The email to search for.
   * @returns {Promise<User | null>} The user if found, null otherwise.
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Updates a user's password.
   * @param {string} id - The user ID.
   * @param {Password} newPassword - The new hashed password.
   * @returns {Promise<void>} Promise that resolves when password is updated.
   */
  updatePassword(id: string, newPassword: Password): Promise<void>;

  /**
   * Updates a user's balance.
   * @param {string} id - The user ID.
   * @param {Amount} newBalance - The new balance to set.
   * @returns {Promise<void>} Promise that resolves when balance is updated.
   */
  updateBalance(id: string, newBalance: Amount): Promise<void>;

  /**
   * Deletes a user by ID.
   * @param {string} id - The user ID.
   * @returns {Promise<void>} Promise that resolves when user is deleted.
   * @throws {Error} If user doesn't exist or delete operation fails.
   */
  deleteById(id: string): Promise<void>;
}
