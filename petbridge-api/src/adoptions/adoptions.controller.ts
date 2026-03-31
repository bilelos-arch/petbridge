import { Controller, Post, Get, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AdoptionsService } from './adoptions.service';
import { CreateAdoptionDto } from './dto/create-adoption.dto';
import { RejectAdoptionDto } from './dto/reject-adoption.dto';
import { AdoptionFiltersDto } from './dto/adoption-filters.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../animals/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('adoptions')
@UseGuards(JwtAuthGuard)
export class AdoptionsController {
  constructor(private readonly adoptionsService: AdoptionsService) {}

  /**
   * Get all adoption requests (admin only)
   */
  @Get()
  @Roles(Role.ADMIN)
  async getAllAdoptions(@Query() filters: AdoptionFiltersDto) {
    return this.adoptionsService.getAllAdoptions(filters);
  }

  /**
   * Create a new adoption request
   */
  @Post()
  async createAdoptionRequest(
    @CurrentUser() currentUser,
    @Body() dto: CreateAdoptionDto,
  ) {
    return this.adoptionsService.createAdoptionRequest(currentUser.id, dto);
  }

  /**
   * Get current user's adoption requests as adopter
   */
  @Get('my-requests')
  async getMyRequests(@CurrentUser() currentUser) {
    return this.adoptionsService.getMyRequests(currentUser.id);
  }

  /**
   * Get adoption requests received by current user as donneur
   */
  @Get('received')
  async getReceivedRequests(@CurrentUser() currentUser) {
    return this.adoptionsService.getReceivedRequests(currentUser.id);
  }

  /**
   * Get adoption request by ID
   */
  @Get(':id')
  async getAdoptionRequestById(
    @Param('id') id: string,
    @CurrentUser() currentUser,
  ) {
    return this.adoptionsService.getAdoptionRequestById(id, currentUser.id);
  }

  /**
   * Cancel an adoption request
   */
  @Patch(':id/cancel')
  async cancelAdoptionRequest(
    @Param('id') id: string,
    @CurrentUser() currentUser,
  ) {
    return this.adoptionsService.cancelAdoptionRequest(id, currentUser.id);
  }

  /**
   * Accept an adoption request
   */
  @Patch(':id/accept')
  async acceptAdoptionRequest(
    @Param('id') id: string,
    @CurrentUser() currentUser,
  ) {
    return this.adoptionsService.acceptAdoptionRequest(id, currentUser.id);
  }

  /**
    * Reject an adoption request
    */
  @Patch(':id/reject')
  async rejectAdoptionRequest(
    @Param('id') id: string,
    @CurrentUser() currentUser,
    @Body() dto: RejectAdoptionDto,
  ) {
    return this.adoptionsService.rejectAdoptionRequest(id, currentUser.id, dto);
  }

  /**
   * Send a pre-acceptance message to adoption request
   */
  @Post(':id/message')
  async sendPreAcceptanceMessage(
    @Param('id') id: string,
    @CurrentUser() currentUser,
    @Body() dto: { content: string },
  ) {
    return this.adoptionsService.sendPreAcceptanceMessage(id, currentUser.id, dto.content);
  }
}
