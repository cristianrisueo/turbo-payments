import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import {
  SendPaymentUseCase,
  SendPaymentRequest,
  SendPaymentResponse,
} from '../application/sendPayment';
import {
  ProcessPaymentUseCase,
  ProcessPaymentRequest,
  ProcessPaymentResponse,
} from '../application/processPayment';
import {
  GetPaymentByIdUseCase,
  GetPaymentByIdRequest,
  GetPaymentByIdResponse,
} from '../application/getPaymentById';
import {
  GetUserPaymentHistoryUseCase,
  GetUserPaymentHistoryRequest,
  GetUserPaymentHistoryResponse,
} from '../application/getPaymentHistory';
import {
  RefundPaymentUseCase,
  RefundPaymentRequest,
  RefundPaymentResponse,
} from '../application/refundPayment';
import { Auth, CurrentUser } from '../../../../packages/auth/auth.decorator';

/**
 * Payment Controller.
 * Handles HTTP requests for payment operations in the payment microservice.
 * All routes are protected with JWT authentication.
 * Users can only access their own payment data.
 */
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly sendPaymentUseCase: SendPaymentUseCase,
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
    private readonly getPaymentByIdUseCase: GetPaymentByIdUseCase,
    private readonly getUserPaymentHistoryUseCase: GetUserPaymentHistoryUseCase,
    private readonly refundPaymentUseCase: RefundPaymentUseCase,
  ) {}

  /**
   * Creates a new payment request.
   * Protected - users can only send payments from their own account.
   * POST /payments
   */
  @Auth()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async sendPayment(
    @Body() request: SendPaymentRequest,
    @CurrentUser('id') currentUserId: string,
  ): Promise<SendPaymentResponse> {
    // Ensures a user can only send payments from their own account
    if (request.fromUserId !== currentUserId) {
      throw new ForbiddenException(
        'You can only send payments from your own account',
      );
    }

    return await this.sendPaymentUseCase.execute(request);
  }

  /**
   * Retrieves a payment by its transaction ID.
   * Protected - users can only view payments they are involved in (sender or receiver).
   * GET /payments/:transactionId
   */
  @Auth()
  @Get(':transactionId')
  @HttpCode(HttpStatus.OK)
  async getPaymentById(
    @Param('transactionId') transactionId: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<GetPaymentByIdResponse> {
    const request: GetPaymentByIdRequest = {
      transactionId,
    };

    // Gets the payment by its ID.
    const payment = await this.getPaymentByIdUseCase.execute(request);

    // Ensures a user can only view payments they are involved in.
    if (
      payment.fromUserId !== currentUserId &&
      payment.toUserId !== currentUserId
    ) {
      throw new ForbiddenException('You can only view your own payments');
    }

    return payment;
  }

  /**
   * Retrieves the payments history for a user.
   * Protected - users can only view their own payment history.
   * GET /payments/user/:userId/history
   */
  @Auth()
  @Get('user/:userId/history')
  @HttpCode(HttpStatus.OK)
  async getUserPaymentHistory(
    @Param('userId') userId: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<GetUserPaymentHistoryResponse> {
    // Ensures a user can only view his own payment history.
    if (userId !== currentUserId) {
      throw new ForbiddenException(
        'You can only view your own payment history',
      );
    }

    const request: GetUserPaymentHistoryRequest = {
      userId,
    };

    return await this.getUserPaymentHistoryUseCase.execute(request);
  }

  /**
   * Processes a pending payment.
   * Protected - users can only process payments they sent.
   * PATCH /payments/:transactionId/process
   */
  @Auth()
  @Patch(':transactionId/process')
  @HttpCode(HttpStatus.OK)
  async processPayment(
    @Param('transactionId') transactionId: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<ProcessPaymentResponse> {
    // Verifies the user is the owner of this payment.
    const payment = await this.getPaymentByIdUseCase.execute({ transactionId });

    if (payment.fromUserId !== currentUserId) {
      throw new ForbiddenException('You can only process payments you sent');
    }

    const request: ProcessPaymentRequest = {
      transactionId,
    };

    return await this.processPaymentUseCase.execute(request);
  }

  /**
   * Refunds a completed payment.
   * Protected - users can only refund payments they originally sent.
   * PATCH /payments/:transactionId/refund
   */
  @Auth()
  @Patch(':transactionId/refund')
  @HttpCode(HttpStatus.OK)
  async refundPayment(
    @Param('transactionId') transactionId: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<RefundPaymentResponse> {
    // Verifies the user is the owner of this payment.
    const payment = await this.getPaymentByIdUseCase.execute({ transactionId });

    if (payment.fromUserId !== currentUserId) {
      throw new ForbiddenException('You can only refund payments you sent');
    }

    const request: RefundPaymentRequest = {
      transactionId,
    };

    return await this.refundPaymentUseCase.execute(request);
  }
}
