import { registerAs } from '@nestjs/config';

/**
 * JWT configuration interface.
 * Defines the structure of the JWT settings.
 */
export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

/**
 * JWT configuration factory.
 * Loads JWT settings from environment variables with sensible defaults.
 */
export const jwtConfig = registerAs('jwt', (): JwtConfig => {
  return {
    secret: process.env.JWT_SECRET || 'super-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  };
});
