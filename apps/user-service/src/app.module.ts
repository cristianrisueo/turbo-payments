import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Shared infrastructure
import { dbConfig } from '../../../packages/db/db.config';
import { DbModule } from '../../../packages/db/db.module';
import { jwtConfig } from '../../../packages/auth/jwt.config';
import { AuthModule } from '../../../packages/auth/auth.module';

// Domain modules
import { UsersModule } from './infrastructure/users.module';

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
  providers: [],
})
export class AppModule {}
