import { Controller, Post, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { ReportFiltersDto } from './dto/report-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../animals/guards/roles.guard';
import { Roles } from '../animals/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async createReport(
    @CurrentUser() user,
    @Body() createReportDto: CreateReportDto,
  ) {
    return this.reportsService.createReport(user.id, createReportDto);
  }

  @Get('my')
  async getUserReports(@CurrentUser() user) {
    return this.reportsService.getUserReports(user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getAllReports(@Body() filters: ReportFiltersDto) {
    return this.reportsService.getAllReports(filters);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getReportById(@Param('id') id: string) {
    return this.reportsService.getReportById(id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateReportStatus(
    @Param('id') id: string,
    @Body() updateReportStatusDto: UpdateReportStatusDto,
  ) {
    return this.reportsService.updateReportStatus(id, updateReportStatusDto);
  }

  @Patch(':id/ban-user')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async banUser(@Param('id') id: string) {
    return this.reportsService.banUser(id);
  }
}