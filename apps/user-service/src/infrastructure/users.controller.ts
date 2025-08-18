import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  ForbiddenException,
} from '@nestjs/common';
import {
  RegisterUserUseCase,
  RegisterUserRequest,
  RegisterUserResponse,
} from '../application/registerUser';
import {
  AuthenticateUserUseCase,
  AuthenticateUserRequest,
  AuthenticateUserResponse,
} from '../application/authenticateUser';
import {
  GetUserByIdUseCase,
  GetUserByIdResponse,
} from '../application/getUserById';
import {
  GetUserByEmailUseCase,
  GetUserByEmailResponse,
} from '../application/getUserByEmail';
import {
  DeleteUserUseCase,
  DeleteUserResponse,
} from '../application/deleteUser';
import {
  ChangePasswordUseCase,
  ChangePasswordRequest,
  ChangePasswordResponse,
} from '../application/changePassword';
import {
  UpdateBalanceUseCase,
  UpdateBalanceRequest,
  UpdateBalanceResponse,
} from '../application/updateBalance';
import { Auth, CurrentUser } from '../../../../packages/auth/auth.decorator';

/**
 * User's Controller.
 * Handles HTTP requests for user-related operations.
 * Acts as the entry point for the users domain from the outside world.
 * Some routes are protected with JWT authentication.
 */
@Controller('users')
export class UserController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly getUserByEmailUseCase: GetUserByEmailUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly updateBalanceUseCase: UpdateBalanceUseCase,
  ) {}

  /**
   * Register a new user.
   * Public endpoint - no authentication required.
   * POST /users/register
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() request: RegisterUserRequest,
  ): Promise<RegisterUserResponse> {
    return await this.registerUserUseCase.execute(request);
  }

  /**
   * Authenticate user with email and password.
   * Public endpoint - no authentication required.
   * Returns JWT token for subsequent authenticated requests.
   * POST /users/authenticate
   */
  @Post('authenticate')
  @HttpCode(HttpStatus.OK)
  async authenticate(
    @Body() request: AuthenticateUserRequest,
  ): Promise<AuthenticateUserResponse> {
    return await this.authenticateUserUseCase.execute(request);
  }

  /**
   * Get user by ID.
   * Protected - users can only view their own profile.
   * GET /users/:id
   */
  @Auth()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getUserById(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<GetUserByIdResponse> {
    // Checks the ID received as param with the ID from JWT.
    if (id !== currentUserId) {
      throw new ForbiddenException('You can only view your own profile');
    }

    return await this.getUserByIdUseCase.execute({ id });
  }

  /**
   * Get user by email.
   * Protected - users can only lookup their own email.
   * GET /users/:email
   */
  @Auth()
  @Get(':email')
  @HttpCode(HttpStatus.OK)
  async getUserByEmail(
    @Param('email') email: string,
    @CurrentUser('email') currentUserEmail: string,
  ): Promise<GetUserByEmailResponse> {
    // Checks the email received as param with the email from JWT.
    if (email !== currentUserEmail) {
      throw new ForbiddenException('You can only lookup your own email');
    }

    return await this.getUserByEmailUseCase.execute({ email });
  }

  /**
   * Change user password.
   * Protected - users can only change their own password.
   * PATCH /users/:id/password
   */
  @Auth()
  @Patch(':id/update-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Param('id') id: string,
    @Body() request: Omit<ChangePasswordRequest, 'id'>,
    @CurrentUser('id') currentUserId: string,
  ): Promise<ChangePasswordResponse> {
    // Ensure user can only change their own password
    if (id !== currentUserId) {
      throw new ForbiddenException('You can only change your own password');
    }

    return await this.changePasswordUseCase.execute({ id, ...request });
  }

  /**
   * Update user balance.
   * Protected - users can only update their own balance.
   * PATCH /users/:id/balance
   */
  @Auth()
  @Patch(':id/balance')
  @HttpCode(HttpStatus.OK)
  async updateBalance(
    @Param('id') id: string,
    @Body() request: Omit<UpdateBalanceRequest, 'id'>,
    @CurrentUser('id') currentUserId: string,
  ): Promise<UpdateBalanceResponse> {
    // Checks the ID received as param with the ID from JWT.
    if (id !== currentUserId) {
      throw new ForbiddenException('You can only update your own balance');
    }

    return await this.updateBalanceUseCase.execute({ id, ...request });
  }

  /**
   * Delete user by ID.
   * Protected - users can only delete their own account.
   * DELETE /users/:id
   */
  @Auth()
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<DeleteUserResponse> {
    // Checks the ID received as param with the ID from JWT.
    if (id !== currentUserId) {
      throw new ForbiddenException('You can only delete your own account');
    }

    return await this.deleteUserUseCase.execute({ id });
  }
}
