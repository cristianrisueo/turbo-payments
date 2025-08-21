import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Payment Exception Filter.
 * Converts payment domain errors into proper HTTP responses with status codes.
 * Provides better user experience by returning appropriate error messages.
 */
@Catch()
export class PaymentExceptionFilter implements ExceptionFilter {
  /**
   * Catches exceptions and maps them to HTTP responses.
   * @param exception The thrown exception.
   * @param host The context of the request.
   */
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // If it's already an HTTP exception, let it pass through
    if (exception instanceof HttpException) {
      return response
        .status(exception.getStatus())
        .json(exception.getResponse());
    }

    // Map domain errors to appropriate HTTP status codes using a helper function
    const { status, message } = this.mapDomainErrorToHttp(exception.message);

    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Helper function that maps payment domain error messages to HTTP status codes and user-friendly messages.
   * @param errorMessage The error message from the payment domain.
   * @returns An object containing the HTTP status code and a user-friendly message.
   */
  private mapDomainErrorToHttp(errorMessage: string): {
    status: number;
    message: string;
  } {
    // Payment not found errors
    if (
      errorMessage.includes('Payment not found') ||
      errorMessage.includes('not found')
    ) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Payment not found',
      };
    }

    // User validation errors (from microservice communication)
    if (
      errorMessage.includes('Sender user not found') ||
      errorMessage.includes('Receiver user not found') ||
      errorMessage.includes('Original sender user not found') ||
      errorMessage.includes('Original receiver user not found')
    ) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'One or more users involved in the payment do not exist',
      };
    }

    // Payment business rule errors
    if (errorMessage.includes('Cannot send payment to yourself')) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'You cannot send a payment to yourself',
      };
    }

    if (errorMessage.includes('Payment amount must be greater than zero')) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Payment amount must be greater than zero',
      };
    }

    // Payment status errors
    if (
      errorMessage.includes('Cannot process payment with status') ||
      errorMessage.includes('Cannot complete payment with status') ||
      errorMessage.includes('Cannot fail payment with status')
    ) {
      return {
        status: HttpStatus.CONFLICT,
        message: 'Payment cannot be processed in its current status',
      };
    }

    if (errorMessage.includes('Can only refund completed payments')) {
      return {
        status: HttpStatus.CONFLICT,
        message: 'Only completed payments can be refunded',
      };
    }

    // Balance and funding errors
    if (
      errorMessage.includes('Insufficient balance') ||
      errorMessage.includes('insufficient balance')
    ) {
      return {
        status: HttpStatus.PAYMENT_REQUIRED,
        message: 'Insufficient balance to complete this payment',
      };
    }

    // Currency and amount validation errors
    if (
      errorMessage.includes('Currency code is required') ||
      errorMessage.includes('Unsupported currency code') ||
      errorMessage.includes('Currency code must be exactly 3 characters')
    ) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid currency code provided',
      };
    }

    if (
      errorMessage.includes('Amount is required') ||
      errorMessage.includes('Amount must be a positive number') ||
      errorMessage.includes('Amount cannot be zero or negative')
    ) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid payment amount provided',
      };
    }

    // Transaction ID validation errors
    if (
      errorMessage.includes('Transaction ID is required') ||
      errorMessage.includes('Transaction ID cannot be empty') ||
      errorMessage.includes('Transaction ID cannot exceed')
    ) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid transaction ID provided',
      };
    }

    // Description validation errors
    if (
      errorMessage.includes('Payment description is required') ||
      errorMessage.includes('Payment description cannot exceed')
    ) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid payment description provided',
      };
    }

    // Duplicate payment errors
    if (errorMessage.includes('Payment with this ID already exists')) {
      return {
        status: HttpStatus.CONFLICT,
        message: 'A payment with this transaction ID already exists',
      };
    }

    // Service communication errors (microservice failures)
    if (
      errorMessage.includes('Failed to communicate with user service') ||
      errorMessage.includes('Service communication error') ||
      errorMessage.includes('User service error')
    ) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message:
          'Payment service is temporarily unavailable. Please try again later',
      };
    }

    // Database or save failures
    if (
      errorMessage.includes('Failed to save') ||
      errorMessage.includes('Failed to update') ||
      errorMessage.includes('Failed to delete')
    ) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while processing your payment request',
      };
    }

    // Transfer and refund failures
    if (
      errorMessage.includes('Transfer failed') ||
      errorMessage.includes('Refund failed')
    ) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Payment processing failed. Please try again',
      };
    }

    // Payment creation failures
    if (errorMessage.includes('Payment creation failed')) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message:
          'Unable to create payment. Please check your input and try again',
      };
    }

    // Default to bad request for unknown payment domain errors
    return {
      status: HttpStatus.BAD_REQUEST,
      message: errorMessage,
    };
  }
}
