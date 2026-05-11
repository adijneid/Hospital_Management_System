import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { JwtPayload } from './jwt.strategy';

/**
 * Resolves the JWT payload attached to the request by JwtStrategy/JwtAuthGuard,
 * regardless of whether the call came in over REST or GraphQL. Mirrors the
 * shape returned by JwtStrategy.validate().
 */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtPayload => {
    if (ctx.getType<'http' | 'graphql'>() === 'graphql') {
      return GqlExecutionContext.create(ctx).getContext().req.user;
    }
    return ctx.switchToHttp().getRequest().user;
  },
);
