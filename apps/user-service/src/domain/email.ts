/**
 * Email Value Object.
 * Represents an email address with validation and normalization.
 */
export class Email {
  private constructor(private readonly _value: string) {}

  /**
   * Factory method to create a new Email instance.
   * @param {string} value - The email address to validate and normalize.
   * @throws {Error} If the email is empty or invalid.
   * @returns {Email} A new instance of Email with the normalized value.
   */
  static create(value: string): Email {
    // Checks if a value is received.
    if (!value) {
      throw new Error('Email cannot be empty');
    }

    // Checks the email format using a regex.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }

    // Normalizes the value and returns an email instance.
    const normalizedEmail = value.toLowerCase().trim();
    return new Email(normalizedEmail);
  }

  /**
   * Gets the email value. For direct access.
   * @returns {string} The normalized email address.
   */
  get value(): string {
    return this._value;
  }

  /**
   * Gets the email value. For framework compatibility.
   * This is useful for serialization or when a string representation is needed.
   * @returns {string} The normalized email address.
   */
  toString(): string {
    return this._value;
  }

  /**
   * Compares this email with another email.
   * Two emails are considered equal if they have the same normalized value.
   * @param {Email} other - The other email to compare with.
   * @returns {boolean} True if both emails are equal, false otherwise.
   */
  equals(other: Email): boolean {
    return this._value === other._value;
  }
}
