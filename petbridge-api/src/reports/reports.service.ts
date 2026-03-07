import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto, ReportCible } from './dto/create-report.dto';
import { UpdateReportStatusDto, ReportStatus } from './dto/update-report-status.dto';
import { ReportFiltersDto } from './dto/report-filters.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(userId: string, createReportDto: CreateReportDto) {
    // Verify target existence based on ReportCible type
    await this.verifyTargetExists(createReportDto);

    // Check user cannot report themselves
    if (createReportDto.cible === ReportCible.UTILISATEUR && createReportDto.cibleUserId === userId) {
      throw new ForbiddenException('You cannot report yourself');
    }

    return this.prisma.report.create({
      data: {
        ...createReportDto,
        authorId: userId,
      },
    });
  }

  async getUserReports(userId: string) {
    return this.prisma.report.findMany({
      where: {
        authorId: userId,
      },
    });
  }

  async getAllReports(filters: ReportFiltersDto & { page?: number; limit?: number }) {
    const { page = 1, limit = 10, status, cible } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (cible) {
      where.cible = cible;
    }

    const [data, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              email: true,
              profile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getReportById(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async updateReportStatus(id: string, updateReportStatusDto: UpdateReportStatusDto) {
    const report = await this.prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return this.prisma.report.update({
      where: { id },
      data: updateReportStatusDto,
    });
  }

  async banUser(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (!report.cibleUserId) {
      throw new ForbiddenException('This report does not have a user target');
    }

    // Ban user using Prisma transaction
    return this.prisma.$transaction(async (prisma) => {
      // Update user status to banned
      const bannedUser = await prisma.user.update({
        where: { id: report.cibleUserId! },
        data: { isBanned: true },
      });

      // Update report status to resolved
      const updatedReport = await prisma.report.update({
        where: { id },
        data: { status: ReportStatus.RESOLU },
      });

      return { user: bannedUser, report: updatedReport };
    });
  }

  private async verifyTargetExists(createReportDto: CreateReportDto) {
    const { cible, cibleUserId, cibleAnimalId, cibleMessageId } = createReportDto;

    switch (cible) {
      case ReportCible.UTILISATEUR:
        if (!cibleUserId) {
          throw new NotFoundException('Target user ID is required');
        }
        const user = await this.prisma.user.findUnique({ where: { id: cibleUserId } });
        if (!user) {
          throw new NotFoundException('Target user not found');
        }
        break;

      case ReportCible.ANIMAL:
        if (!cibleAnimalId) {
          throw new NotFoundException('Target animal ID is required');
        }
        const animal = await this.prisma.animal.findUnique({ where: { id: cibleAnimalId } });
        if (!animal) {
          throw new NotFoundException('Target animal not found');
        }
        break;

      case ReportCible.MESSAGE:
        if (!cibleMessageId) {
          throw new NotFoundException('Target message ID is required');
        }
        const message = await this.prisma.message.findUnique({ where: { id: cibleMessageId } });
        if (!message) {
          throw new NotFoundException('Target message not found');
        }
        break;

      default:
        throw new NotFoundException('Invalid target type');
    }
  }
}