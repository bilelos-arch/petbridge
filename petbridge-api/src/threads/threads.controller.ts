import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ThreadsService } from './threads.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../animals/guards/roles.guard';
import { Roles } from '../animals/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('threads')
@UseGuards(JwtAuthGuard)
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  /**
   * Get all threads for current user
   */
  @Get()
  async getThreads(@CurrentUser() currentUser: any) {
    return this.threadsService.getThreadsByCurrentUser(currentUser.id);
  }

  /**
   * Get thread with messages
   */
  @Get(':id')
  async getThreadById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.threadsService.getThreadById(id, currentUser.id);
  }

  /**
   * Send a new message
   */
  @Post(':id/messages')
  async sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: any,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.threadsService.sendMessage(id, currentUser.id, createMessageDto);
  }

  /**
   * Mark messages as read
   */
  @Patch(':id/messages/read')
  async markMessagesAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.threadsService.markMessagesAsRead(id, currentUser.id);
  }

  /**
   * Close thread (admin only)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async closeThread(@Param('id', ParseUUIDPipe) id: string) {
    return this.threadsService.closeThread(id);
  }
}