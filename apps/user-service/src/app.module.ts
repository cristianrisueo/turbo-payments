import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';

// Shared infrastructure
import { dbConfig } from '../../../packages/db/db.config';
import { DbModule } from '../../../packages/db/db.module';
import { jwtConfig } from '../../../packages/auth/jwt.config';
import { AuthModule } from '../../../packages/auth/auth.module';

// User's service modules
import { UsersModule } from './infrastructure/users.module';
import { UserExceptionFilter } from './infrastructure/user.filter';

/**
 * Root Application Module.
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
    UsersModule,
  ],
  providers: [
    // Global exception filter for user domain errors
    {
      provide: APP_FILTER,
      useClass: UserExceptionFilter,
    },
  ],
})
export class AppModule {}
