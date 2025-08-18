import { registerAs } from "@nestjs/config";

/**
 * Database configuration for microservices.
 * Configures MongoDB connections with environment variables.
 */
export const dbConfig = registerAs("db", () => {
  const usersDbUrl = process.env.USERS_DB_URL;
  if (!usersDbUrl) throw new Error("USERS_DB_URL is not defined");

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
  };
});
