import { Injectable, ForbiddenException, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@guards/roles_guard/public.decorator';

@Injectable()
export class AuthGuardService implements CanActivate {
    constructor(
      private readonly jwtService: JwtService,
      private reflector: Reflector
    ) {}

    canActivate(context: ExecutionContext): boolean {
      // Public routes
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (isPublic) {
        return true;
      }

      let request;
      
      try {
        // Context HTTP REST
        request = context.switchToHttp().getRequest();
        if (!request) {
          const gqlContext = GqlExecutionContext.create(context);
          request = gqlContext.getContext().req;
        }
      } catch (error) {
        const gqlContext = GqlExecutionContext.create(context);
        request = gqlContext.getContext().req;
      }
      
      if (!request) {
        throw new ForbiddenException('Request context not available');
      }

      const token = request.headers['authorization'];
  
      if (!token) {
        throw new ForbiddenException('Authorization token is missing');
      }
      
      try {
        const tokenParts = token.split(' ');
        const jwtToken = tokenParts.length > 1 ? tokenParts[1] : token;
        
        const decoded = this.jwtService.verify(jwtToken, { secret: process.env.JWT_SECRET });
        const role = decoded['role'];
        request.user = { ...decoded, role };
  
        return true;
      } catch (error) {
        throw new ForbiddenException('Invalid or expired token');
      }
    }
}