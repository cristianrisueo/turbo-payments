import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [
    // Users database connection
    MongooseModule.forRootAsync({
      connectionName: "users",
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const usersConfig = configService.get("db.users");
        if (!usersConfig) {
          throw new Error("Users database configuration not found");
        }

        return usersConfig;
      },
    }),

    // Payments database connection
    MongooseModule.forRootAsync({
      connectionName: "payments",
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const paymentsConfig = configService.get("db.payments");
        if (!paymentsConfig) {
          throw new Error("Payments database configuration not found");
        }

        return paymentsConfig;
      },
    }),
  ],
})
export class DbModule {}
