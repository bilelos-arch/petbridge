import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CheckInsService } from './checkins.service';
import { CreateCheckInDto } from './dto/create-checkin.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}

  /**
   * Create a new check-in (adopter only)
   */
  @Post('threads/:threadId/checkins')
  async createCheckIn(
    @Param('threadId', ParseUUIDPipe) threadId: string,
    @CurrentUser() currentUser: any,
    @Body() createCheckInDto: CreateCheckInDto,
  ) {
    return this.checkInsService.createCheckIn(threadId, currentUser.id, createCheckInDto);
  }

  /**
   * Get all check-ins for a thread
   */
  @Get('threads/:threadId/checkins')
  async getCheckInsByThreadId(
    @Param('threadId', ParseUUIDPipe) threadId: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.checkInsService.getCheckInsByThreadId(threadId, currentUser.id);
  }

  /**
   * Get all check-ins for current user
   */
  @Get('checkins/my')
  async getCheckInsByCurrentUser(@CurrentUser() currentUser: any) {
    return this.checkInsService.getCheckInsByCurrentUser(currentUser.id);
  }
}