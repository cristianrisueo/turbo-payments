import { Injectable, Inject } from '@nestjs/common';
import {
  UserRepositoryInterface,
  USER_REPOSITORY_TOKEN,
} from '../domain/user.repository';
import { Amount } from '../../../../packages/value-objects/amount';

/**
 * Request object for UpdateBalanceUseCase.
 */
export interface UpdateBalanceRequest {
  id: string;
  balanceInCents: number;
}

/**
 * Response object for UpdateBalanceUseCase.
 */
export interface UpdateBalanceResponse {
  id: string;
  newBalance: string;
  message: string;
}

/**
 * Use case for updating a user's balance.
 * Handles the business logic for balance updates.
 * It coordinates the domain entity and repository.
 */
@Injectable()
export class UpdateBalanceUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  /**
   * Updates a user's balance.
   * @param {UpdateBalanceRequest} balanceData - The request with user ID and new balance.
   * @returns {Promise<UpdateBalanceResponse>} The balance update confirmation.
   * @throws {Error} If user doesn't exist or the update fails.
   */
  async execute(
    balanceData: UpdateBalanceRequest,
  ): Promise<UpdateBalanceResponse> {
    // Finds the user by ID. Throws an error if user doesn't exist.
    const user = await this.userRepository.findById(balanceData.id);
    if (!user) {
      throw new Error('User not found');
    }

    // Creates a new Amount instance from the new balance in cents.
    const newBalance = Amount.create(balanceData.balanceInCents);

    // Updates the user's balance using the user's domain entity method.
    const updatedUser = user.updateBalance(newBalance);

    // Invokes the repository to update the user's balance. Trows an error if the update fails.
    await this.userRepository.updateBalance(
      updatedUser.id,
      updatedUser.balance,
    );

    // Returns a confirmation response.
    return {
      id: updatedUser.id,
      newBalance: updatedUser.balance.toFormattedString(),
      message: 'Balance successfully updated',
    };
  }
}
