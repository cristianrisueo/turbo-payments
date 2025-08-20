import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * User response from user-service API.
 */
export interface UserResponse {
  id: string;
  email: string;
  balance: number; // Balance in cents
}

/**
 * Transfer balance request to user-service.
 */
export interface TransferBalanceRequest {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
}

/**
 * Transfer balance response from user-service.
 */
export interface TransferBalanceResponse {
  success: boolean;
  message: string;
  senderNewBalance: number; // In cents
  receiverNewBalance: number; // In cents
}

/**
 * HTTP client for communicating with the user-service microservice.
 * Handles all user-related operations needed by the payment service.
 * Follows the adapter pattern for external service communication.
 */
@Injectable()
export class UserServiceClient {
  private readonly userServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.userServiceUrl =
      this.configService.get<string>('USERS_SERVICE_URL') ||
      'http://user-service:3001';
  }

  /**
   * Retrieves a user by ID from the user-service.
   * @param {string} userId - The user ID to retrieve.
   * @returns {Promise<UserResponse | null>} The user data or null if not found.
   * @throws {HttpException} If service communication fails.
   */
  async getUserById(userId: string): Promise<UserResponse | null> {
    try {
      // Makes a get call to retrieve the user by ID.
      const response = await fetch(`${this.userServiceUrl}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Checks if user is not found.
      if (response.status === 404) {
        return null;
      }

      // Checks any other error.
      if (!response.ok) {
        throw new HttpException(
          `User service error: ${response.statusText}`,
          response.status,
        );
      }

      // Parses the user's data and returns it.
      const userData = (await response.json()) as {
        id: string;
        email: string;
        balance: number;
      };

      return {
        id: userData.id,
        email: userData.email,
        balance: userData.balance,
      };
    } catch (error: unknown) {
      // Catches the errors.
      if (error instanceof HttpException) {
        throw error;
      }

      // Network or parsing errors.
      throw new HttpException(
        `Failed to communicate with user service: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Transfers balance between two users via user-service.
   * This is an atomic operation that updates both user balances or completely fails.
   * @param {TransferBalanceRequest} transferData - The transfer details.
   * @returns {Promise<TransferBalanceResponse>} The transfer result.
   * @throws {HttpException} If transfer fails or service communication fails.
   */
  async transferBalance(
    transferData: TransferBalanceRequest,
  ): Promise<TransferBalanceResponse> {
    try {
      // Makes a post call to transfer the balance passing the arguments needed.
      const response = await fetch(
        `${this.userServiceUrl}/users/transfer-balance`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fromUserId: transferData.fromUserId,
            toUserId: transferData.toUserId,
            amountCents: transferData.amountCents,
          }),
        },
      );

      // If something fails throws a new error with the details.
      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({ message: 'Unknown error' }))) as { message?: string };
        throw new HttpException(
          `Transfer failed: ${errorData.message || response.statusText}`,
          response.status,
        );
      }

      // If goes well, creates a successful transfer object and returns it.
      const transferResult = (await response.json()) as {
        success: boolean;
        message: string;
        senderNewBalance: number;
        receiverNewBalance: number;
      };

      return {
        success: transferResult.success,
        message: transferResult.message,
        senderNewBalance: transferResult.senderNewBalance,
        receiverNewBalance: transferResult.receiverNewBalance,
      };
    } catch (error: unknown) {
      // Catches the errors.
      if (error instanceof HttpException) {
        throw error;
      }

      // Network or parsing errors
      throw new HttpException(
        `Failed to communicate with user service: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
