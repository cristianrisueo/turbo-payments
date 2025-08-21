import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';

// Shared infrastructure
import { dbConfig } from '../../../packages/db/db.config';
import { DbModule } from '../../../packages/db/db.module';
import { jwtConfig } from '../../../packages/auth/jwt.config';
import { AuthModule } from '../../../packages/auth/auth.module';

// Payment service modules
import { PaymentsModule } from './infrastructure/payments.module';
import { PaymentExceptionFilter } from './infrastructure/payments.filter';

/**
 * Root Application Module for Payment Service.
 * Configures the main application with all domain modules and shared infrastructure.
 * Follows hexagonal architecture with clean module separation.
 */
@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [dbConfig, jwtConfig],
    }),

    // Shared infrastructure
    DbModule,
    AuthModule,

    // Domain modules
    PaymentsModule,
  ],
  providers: [
    // Global exception filter for payment domain errors
    {
      provide: APP_FILTER,
      useClass: PaymentExceptionFilter,
    },
  ],
})
export class AppModule {}
