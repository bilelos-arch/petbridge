import { Controller, Get, Post, Put, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { CheckInsService } from './checkins.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('checkins')
@UseGuards(JwtAuthGuard)
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}

  @Get('my')
  async getMyCheckIns(@CurrentUser() currentUser: any) {
    return this.checkInsService.getMyCheckIns(currentUser.id);
  }

  @Get('adoption/:adoptionId')
  async getByAdoption(
    @Param('adoptionId', ParseUUIDPipe) adoptionId: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.checkInsService.getCheckInsByAdoption(adoptionId, currentUser.id);
  }

  @Post('adoption/:adoptionId')
  async create(
    @Param('adoptionId', ParseUUIDPipe) adoptionId: string,
    @CurrentUser() currentUser: any,
    @Body() dto: { message?: string; scheduledFor?: string },
  ) {
    return this.checkInsService.createCheckIn(adoptionId, currentUser.id, dto);
  }

  @Put(':id/respond')
  async respond(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: any,
    @Body() dto: { responseNote?: string; photoUrl?: string; wellbeingScore?: number },
  ) {
    return this.checkInsService.respondToCheckIn(id, currentUser.id, dto);
  }

  @Get('adoption/:adoptionId/timeline')
  async getTimeline(
    @Param('adoptionId', ParseUUIDPipe) adoptionId: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.checkInsService.getTimeline(adoptionId, currentUser.id);
  }

  @Post('auto/:adoptionId')
  async createAutoCheckIns(
    @Param('adoptionId', ParseUUIDPipe) adoptionId: string,
    @CurrentUser() currentUser: any,
  ) {
    await this.checkInsService.createAutoCheckIns(adoptionId, currentUser.id);
    return { message: 'Check-ins créés', count: 4 };
  }
}