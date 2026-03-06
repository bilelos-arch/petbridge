import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Public } from '../auth/decorators/public.decorator'; // ← ajouter

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    getMe(@CurrentUser() user: any) {
        return this.usersService.getMe(user.id);
    }

    @Patch('me')
    updateMe(@CurrentUser() user: any, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.updateMe(user.id, updateUserDto);
    }

    @Patch('me/profile')
    upsertProfile(@CurrentUser() user: any, @Body() updateProfileDto: UpdateProfileDto) {
        return this.usersService.upsertProfile(user.id, updateProfileDto);
    }

    @Public()        // ← ajouter
    @Get(':id')
    getUserPublic(@Param('id') id: string) {
        return this.usersService.getUserPublicProfile(id);
    }
}