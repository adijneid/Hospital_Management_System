import {
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RemindersService } from './reminders.service';

@ApiTags('reminders')
@ApiBearerAuth('JWT')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  @Post(':id/send-reminder')
  @Roles('staff')
  @ApiOperation({
    summary: 'Send (or re-send) the reminder email for an appointment',
    description:
      'Staff-only manual trigger. In dev, the response includes an Ethereal preview URL so the captured email can be inspected. Pass `force=true` to bypass the "already sent" guard.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiQuery({
    name: 'force',
    required: false,
    schema: { type: 'boolean' },
    description: 'Re-send even if a reminder has already gone out',
  })
  send(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('force') force?: string,
  ) {
    return this.reminders.sendReminder(id, force === 'true');
  }
}
