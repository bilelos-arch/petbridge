import { Controller, Get, UseGuards } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMatchingAnimals(@CurrentUser() user: any) {
    return this.matchingService.getMatchingAnimals(user.id);
  }
}