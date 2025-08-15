import { Injectable, Inject } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { Email } from '../domain/email';
import {
  UserRepositoryInterface,
  USER_REPOSITORY_TOKEN,
} from '../domain/user.repository';

/**
 * Request object for RegisterUserUseCase.
 */
export interface RegisterUserRequest {
  email: string;
  password: string;
}

/**
 * Response object for RegisterUserUseCase.
 */
export interface RegisterUserResponse {
  id: string;
  email: string;
  createdAt: Date;
}

/**
 * Use case for registering a new user.
 * Handles the business logic for user registration.
 * Validates business rules and coordinates domain objects.
 */
@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  /**
   * Registers a new user in the system.
   * @param {RegisterUserRequest} userData - The body request with user's data.
   * @returns {Promise<RegisterUserResponse>} The registration result.
   * @throws {Error} If user already exists or registration fails.
   */
  async execute(userData: RegisterUserRequest): Promise<RegisterUserResponse> {
    // Creates an email value object from the input data.
    const emailVO = Email.create(userData.email);

    // Checks if the user already exists. Throws an error if it does.
    const existingUser = await this.userRepository.findByEmail(emailVO);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Creates a new user through the User's entity factory method.
    const user = await User.createNewUser(userData.email, userData.password);

    // Invokes the repository to save the new user. Throws an error if save fails.
    await this.userRepository.save(user);

    // Returns a success response.
    return {
      id: user.id,
      email: user.email.value,
      createdAt: user.createdAt,
    };
  }
}
