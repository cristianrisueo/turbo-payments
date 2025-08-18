import {
  UseGuards,
  createParamDecorator,
  ExecutionContext,
} from "@nestjs/common";
import { JwtGuard, AuthenticatedRequest } from "./jwt.guard";

/**
 * Auth decorator that applies JWT authentication to a route.
 * Combines UseGuards with JwtGuard for clean, reusable route protection.
 *
 * Usage:
 * @Auth()
 * @Get('protected')
 * protectedRoute() { ... }
 */
export const Auth = () => UseGuards(JwtGuard);

/**
 * Current User decorator that extracts the user information from the JWT.
 * Must be used on routes protected with @Auth() decorator.
 *
 * Usage:
 * @Auth()
 * @Get('profile')
 * getProfile(@CurrentUser() user: { id: string; email: string }) { ... }
 *
 * Or extract just the user ID:
 * @Auth()
 * @Get('profile')
 * getProfile(@CurrentUser('id') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    // Access the custom request AuthenticatedRequest and gets the user property on it.
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // If instead of all the data we receive a key (id or email) returns only that specific value.
    return data ? user[data as keyof typeof user] : user;
  }
);
