import { registerAs } from "@nestjs/config";

/**
 * Database configuration for microservices.
 * Configures MongoDB connections for both users and payments services.
 */
export const dbConfig = registerAs("db", () => {
  // Users database configuration
  const usersDbUrl = process.env.USERS_DB_URL;
  if (!usersDbUrl) throw new Error("USERS_DB_URL is not defined");

  // Payments database configuration
  const paymentsDbUrl = process.env.PAYMENTS_DB_URL;
  if (!paymentsDbUrl) throw new Error("PAYMENTS_DB_URL is not defined");

  // General configuration options
  const connectionOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  return {
    users: {
      uri: usersDbUrl,
      ...connectionOptions,
    },
    payments: {
      uri: paymentsDbUrl,
      ...connectionOptions,
    },
  };
});
