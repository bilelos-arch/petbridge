import { Controller, Get, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../animals/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AdminUserFiltersDto } from './dto/admin-user-filters.dto';
import { BanUserDto } from './dto/ban-user.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Roles(Role.ADMIN)
    @Get('admin/all')
    getAdminAllUsers(@Query() filters: AdminUserFiltersDto) {
        return this.usersService.getAdminAllUsers(filters);
    }

    @Roles(Role.ADMIN)
    @Patch('admin/:id/ban')
    banUser(@Param('id') id: string, @Body() banUserDto: BanUserDto) {
        return this.usersService.banUser(id, banUserDto);
    }

    @Roles(Role.ADMIN)
    @Patch('admin/:id/unban')
    unbanUser(@Param('id') id: string) {
        return this.usersService.unbanUser(id);
    }

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

    @Public()
    @Get(':id')
    getUserPublic(@Param('id') id: string) {
        return this.usersService.getUserPublicProfile(id);
    }
}