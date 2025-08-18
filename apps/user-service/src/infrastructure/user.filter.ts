import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * User Exception Filter.
 * Converts user domain errors into proper HTTP responses with status codes.
 * Provides better user experience by returning appropriate error messages.
 */
@Catch()
export class UserExceptionFilter implements ExceptionFilter {
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
   * Helper function that maps user domain error messages to HTTP status codes and user-friendly messages.
   * @param errorMessage The error message from the user domain.
   * @returns An object containing the HTTP status code and a user-friendly message.
   */
  private mapDomainErrorToHttp(errorMessage: string): {
    status: number;
    message: string;
  } {
    // Authentication and authorization errors
    if (
      errorMessage.includes('Invalid credentials') ||
      errorMessage.includes('Current password is incorrect')
    ) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: 'Invalid credentials provided',
      };
    }

    // Validation errors
    if (
      errorMessage.includes('Email cannot be empty') ||
      errorMessage.includes('Invalid email format') ||
      errorMessage.includes('Password cannot be empty') ||
      errorMessage.includes('Password must be at least') ||
      errorMessage.includes('Password must contain')
    ) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: errorMessage,
      };
    }

    // Conflict errors (duplicates)
    if (errorMessage.includes('already exists')) {
      return {
        status: HttpStatus.CONFLICT,
        message: 'A user with this email already exists',
      };
    }

    // Not found errors
    if (
      errorMessage.includes('User not found') ||
      errorMessage.includes('not found')
    ) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'User not found',
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
        message: 'An error occurred while processing your request',
      };
    }

    // Default to bad request for unknown user domain errors
    return {
      status: HttpStatus.BAD_REQUEST,
      message: errorMessage,
    };
  }
}
