import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { JwtPayload, JwtService } from "./jwt.service";

/**
 * Extended Request interface to include user information.
 * Adds the user data extracted from the JWT to the request object.
 */
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

/**
 * JWT Guard.
 * Protects routes by validating JWT tokens in Authorization header.
 * Extracts user information and adds it to the request object.
 */
@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Validates the JWT token and adds its claims to the request user object.
   * @param context - The execution context containing the request with the JWT.
   * @returns Promise<boolean> - True if token is valid, throws UnauthorizedException if not
   */
  canActivate(context: ExecutionContext): boolean {
    // Gets the request object from the execution context.
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // Uses helper to extract the JWT from the authorization header. Throws error if not found.
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException("Access token is required");
    }

    try {
      // Validates the token and extract its claims.
      const payload: JwtPayload = this.jwtService.validateToken(token);

      // Add the claims to the user's request object
      request.user = {
        id: payload.sub,
        email: payload.email,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired token", {
        cause: error,
      });
    }
  }

  /**
   * Helper function that extracts the JWT from the authorization header.
   * Expects format: "Bearer <token>".
   * @param request - The HTTP request object.
   * @returns string | undefined - The extracted token or undefined if not found.
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    // Gets the bearer token from the request's header.
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    // Slipts the type from the token.
    const [type, token] = authHeader.split(" ") ?? [];

    // If it's a bearer token returns it (the actual JWT).
    return type === "Bearer" ? token : undefined;
  }
}
