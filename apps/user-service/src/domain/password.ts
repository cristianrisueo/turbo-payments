import * as bcrypt from 'bcrypt';

/**
 * Password Value Object.
 * Represents a securely hashed password with validation.
 * Never stores plaintext passwords, only hashed values.
 */
export class Password {
  private constructor(private readonly _hashedValue: string) {}

  /**
   * Factory method to create a new Password instance from plaintext.
   * Validates the plain text password against security requirements.
   * @param {string} plaintext - The plaintext password to hash and validate.
   * @throws {Error} If the password is empty or doesn't meet security requirements.
   * @returns {Promise<Password>} A new instance of Password from the hashed value.
   */
  static async createFromPlaintext(plaintext: string): Promise<Password> {
    // Checks if a value is received.
    if (!plaintext) {
      throw new Error('Password cannot be empty');
    }

    // Checks the password length.
    if (plaintext.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Checks the password format using a regex.
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(plaintext)) {
      throw new Error(
        'Password must contain at least one lowercase letter, one uppercase letter, and one number',
      );
    }

    // Encrypts the value and creates a new password instance using the encryption.
    const saltRounds = 12;
    const hashedValue = await bcrypt.hash(plaintext, saltRounds);

    return new Password(hashedValue);
  }

  /**
   * Factory method to create a Password instance from an already hashed value.
   * Used when loading users from database where passwords are already hashed.
   * @param {string} hashedValue - The already hashed password value.
   * @returns {Password} A new instance of Password with the provided hash.
   */
  static createFromHash(hashedValue: string): Password {
    if (!hashedValue) {
      throw new Error('Hashed password cannot be empty');
    }

    return new Password(hashedValue);
  }

  /**
   * Gets the hashed password value. For direct access.
   * @returns {string} The hashed password.
   */
  get value(): string {
    return this._hashedValue;
  }

  /**
   * Gets the hashed password value. For framework compatibility.
   * This is useful for serialization or when a string representation is needed.
   * @returns {string} The hashed password.
   */
  toString(): string {
    return this._hashedValue;
  }

  /**
   * Verifies if a plaintext password matches this hashed password.
   * @param {string} plaintext - The plaintext password to verify.
   * @returns {Promise<boolean>} True if the password matches, false otherwise.
   */
  async verify(plaintext: string): Promise<boolean> {
    return await bcrypt.compare(plaintext, this._hashedValue);
  }

  /**
   * Compares this password with another password.
   * Two passwords are considered equal if they have the same hash.
   * @param {Password} other - The other password to compare with.
   * @returns {boolean} True if both passwords have the same hash, false otherwise.
   */
  equals(other: Password): boolean {
    return this._hashedValue === other._hashedValue;
  }
}
