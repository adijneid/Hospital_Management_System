import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GqlJwtAuthGuard extends AuthGuard('jwt') {
  getRequest(ctx: ExecutionContext) {
    return GqlExecutionContext.create(ctx).getContext().req;
  }

  handleRequest<TUser = any>(err: any, user: TUser): TUser {
    if (err || !user) {
      throw new UnauthorizedException('Invalid or expired token.');
    }
    return user;
  }
}
