import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    // GraphQL requests don't have an HTTP response — let Apollo's formatError handle them.
    if (typeof ctx.getResponse !== 'function' || !ctx.getResponse()) return;

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    if (!response || typeof response.status !== 'function') return;

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let body: Record<string, unknown>;
    if (exception instanceof HttpException) {
      const r = exception.getResponse();
      body =
        typeof r === 'string'
          ? { success: false, message: r }
          : { success: false, ...(r as Record<string, unknown>) };
    } else {
      // Unknown error — log full details server-side, return a generic shape to the client.
      this.logger.error(
        `Unhandled exception on ${request?.method} ${request?.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      body = {
        success: false,
        message: 'Internal server error.',
        statusCode: status,
      };
    }

    response.status(status).json(body);
  }
}
