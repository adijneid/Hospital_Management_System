import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * GraphQL contexts expose `req` differently than HTTP, so the default
 * ThrottlerGuard's IP extraction throws on every GraphQL request. Skip
 * throttling for GraphQL — Apollo can be rate-limited at a different layer
 * if needed (e.g., complexity analysis).
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType<string>() === 'graphql') return true;
    return super.canActivate(context);
  }
}
