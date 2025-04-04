import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../roles_guard/src/public.decorator';

@Injectable()
export class ApiKeyGuardService implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    try {
      // Contexte HTTP REST
      const request = context.switchToHttp().getRequest();
      if (request) {
        return this.validateApiKey(request.headers['x-api-key']);
      }
    } catch (error) {
    }

    // Contexte GraphQL
    const gqlContext = GqlExecutionContext.create(context);
    const { req } = gqlContext.getContext();
    
    if (!req) {
      throw new UnauthorizedException('Request context not available');
    }

    return this.validateApiKey(req.headers['x-api-key']);
  }

  private validateApiKey(apiKey: string): boolean {
    if (!apiKey) {
      throw new UnauthorizedException('API key missing');
    }

    if (apiKey === process.env.API_KEY_ACTIVE || apiKey === process.env.API_KEY_OLD) {
      return true;
    } else {
      throw new UnauthorizedException('Invalid API key');
    }
  }
}