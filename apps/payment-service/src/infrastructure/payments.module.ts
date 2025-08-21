import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Shared infrastructure
import { AuthModule } from '../../../../packages/auth/auth.module';

// Domain
import { PAYMENT_REPOSITORY_TOKEN } from '../domain/payment.repository';

// Application
import { SendPaymentUseCase } from '../application/sendPayment';
import { ProcessPaymentUseCase } from '../application/processPayment';
import { GetPaymentByIdUseCase } from '../application/getPaymentById';
import { GetUserPaymentHistoryUseCase } from '../application/getPaymentHistory';
import { RefundPaymentUseCase } from '../application/refundPayment';

// Infrastructure
import { PaymentRepository } from './mongo.repository';
import { PaymentSchema } from './mongo.schema';
import { PaymentController } from './payments.controller';
import { UserServiceClient } from './userServiceClient';

/**
 * Payments Module.
 * Configures and wires together all components of the payments service.
 * Follows hexagonal architecture principles with clean dependency injection.
 */
@Module({
  imports: [
    // Registers Payment schema with the 'payments' database connection.
    MongooseModule.forFeature(
      [{ name: 'Payment', schema: PaymentSchema }],
      'payments',
    ),

    // Imports Auth module for JWT functionality.
    AuthModule,
  ],
  // Controllers (HTTP layer)
  controllers: [PaymentController],
  providers: [
    // Use cases (Application layer)
    SendPaymentUseCase,
    ProcessPaymentUseCase,
    GetPaymentByIdUseCase,
    GetUserPaymentHistoryUseCase,
    RefundPaymentUseCase,

    // Repository implementation (Infrastructure layer)
    {
      provide: PAYMENT_REPOSITORY_TOKEN,
      useClass: PaymentRepository,
    },

    // External service clients (Infrastructure layer)
    UserServiceClient,
  ],
  // Exports the use cases so other modules can use them
  exports: [
    SendPaymentUseCase,
    ProcessPaymentUseCase,
    GetPaymentByIdUseCase,
    GetUserPaymentHistoryUseCase,
    RefundPaymentUseCase,
    UserServiceClient,
  ],
})
export class PaymentsModule {}
