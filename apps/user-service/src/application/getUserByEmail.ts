import { Injectable, Inject } from '@nestjs/common';
import { Email } from '../domain/email';
import {
  UserRepositoryInterface,
  USER_REPOSITORY_TOKEN,
} from '../domain/user.repository';

/**
 * Request object for GetUserByEmailUseCase.
 */
export interface GetUserByEmailRequest {
  email: string;
}

/**
 * Response object for GetUserByEmailUseCase.
 */
export interface GetUserByEmailResponse {
  id: string;
  email: string;
  createdAt: Date;
}

/**
 * Use case for retrieving a user by email address.
 * Handles the business logic for user retrieval by email.
 * Coordinates domain objects and repository access.
 */
@Injectable()
export class GetUserByEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  /**
   * Retrieves a user by their email address.
   * @param {GetUserByEmailRequest} userData - The body request with user's email.
   * @returns {Promise<GetUserByEmailResponse>} The user's data.
   * @throws {Error} If user doesn't exist or retrieval fails.
   */
  async execute(
    userData: GetUserByEmailRequest,
  ): Promise<GetUserByEmailResponse> {
    // Creates an email value object from the input data.
    const emailVO = Email.create(userData.email);

    // Finds the user by email. Throws an error if user doesn't exist.
    const user = await this.userRepository.findByEmail(emailVO);
    if (!user) {
      throw new Error('User not found');
    }

    // Returns response with user's data.
    return {
      id: user.id,
      email: user.email.value,
      createdAt: user.createdAt,
    };
  }
}
