import { Injectable } from "@nestjs/common";
import { JwtService as NestJwtService } from "@nestjs/jwt";

/**
 * JWT payload interface.
 * Defines the structure of data stored in JWT tokens.
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string; // User email
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

/**
 * JWT Service.
 * Handles JWT token generation and validation logic.
 */
@Injectable()
export class JwtService {
  constructor(private readonly nestJwtService: NestJwtService) {}

  /**
   * Generates a JWT token for a user.
   * @param {string} userId - The user's unique identifier.
   * @param {string} email - The user's email address.
   * @returns {string} The generated JWT token.
   */
  generateToken(userId: string, email: string): string {
    const payload: JwtPayload = {
      sub: userId,
      email: email,
    };

    return this.nestJwtService.sign(payload);
  }

  /**
   * Validates and decodes a JWT token.
   * @param {string} token - The JWT token to validate.
   * @returns {JwtPayload} The decoded payload.
   * @throws {Error} If token is invalid or expired.
   */
  validateToken(token: string): JwtPayload {
    try {
      return this.nestJwtService.verify(token);
    } catch (error) {
      throw new Error("Invalid or expired token", { cause: error });
    }
  }
}
