import { Injectable, Inject } from '@nestjs/common';
import {
  UserRepositoryInterface,
  USER_REPOSITORY_TOKEN,
} from '../domain/user.repository';

/**
 * Request object for GetUserByIdUseCase.
 */
export interface GetUserByIdRequest {
  id: string;
}

/**
 * Response object for GetUserByIdUseCase.
 */
export interface GetUserByIdResponse {
  id: string;
  email: string;
  createdAt: Date;
}

/**
 * Use case for retrieving a user by ID.
 * Handles the business logic for user retrieval.
 * Coordinates domain objects and repository access.
 */
@Injectable()
export class GetUserByIdUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  /**
   * Retrieves a user by ID.
   * @param {GetUserByIdRequest} userData - The body request with user's ID.
   * @returns {Promise<GetUserByIdResponse>} The user's data.
   * @throws {Error} If user doesn't exist or retrieval fails.
   */
  async execute(userData: GetUserByIdRequest): Promise<GetUserByIdResponse> {
    // Finds the user by ID. Throws an error if user doesn't exist.
    const user = await this.userRepository.findById(userData.id);
    if (!user) {
      throw new Error('User not found');
    }

    // Returns a response with user's data.
    return {
      id: user.id,
      email: user.email.value,
      createdAt: user.createdAt,
    };
  }
}
