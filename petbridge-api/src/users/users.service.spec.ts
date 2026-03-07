import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUserFiltersDto } from './dto/admin-user-filters.dto';
import { BanUserDto } from './dto/ban-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAdminAllUsers', () => {
    it('should return paginated users without search or ban filter', async () => {
      const filters: AdminUserFiltersDto = { page: 1, limit: 10 };
      
      const mockUsers = [
        { id: '1', email: 'user1@example.com', password: 'pwd', refreshTokens: [] },
        { id: '2', email: 'user2@example.com', password: 'pwd', refreshTokens: [] },
      ];

      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prismaService.user.count as jest.Mock).mockResolvedValue(2);

      const result = await service.getAdminAllUsers(filters);

      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({ id: '1', email: 'user1@example.com' }),
          expect.objectContaining({ id: '2', email: 'user2@example.com' }),
        ]),
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      expect(result.data[0]).not.toHaveProperty('password');
      expect(result.data[0]).not.toHaveProperty('refreshTokens');
    });
  });

  describe('banUser', () => {
    it('should ban a user and return sanitized user', async () => {
      const userId = '1';
      const dto: BanUserDto = { reason: 'Spam' };
      
      const mockUser = { 
        id: userId, 
        email: 'user@example.com', 
        password: 'pwd', 
        refreshTokens: [],
        isBanned: true,
        bannedAt: expect.any(Date),
        bannedReason: dto.reason,
        profile: null,
      };

      (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.banUser(userId, dto);

      expect(result).toEqual(
        expect.objectContaining({
          id: userId,
          email: 'user@example.com',
          isBanned: true,
          bannedReason: dto.reason,
        })
      );
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshTokens');
    });
  });

  describe('unbanUser', () => {
    it('should unban a user and return sanitized user', async () => {
      const userId = '1';
      
      const mockUser = { 
        id: userId, 
        email: 'user@example.com', 
        password: 'pwd', 
        refreshTokens: [],
        isBanned: false,
        bannedAt: null,
        bannedReason: null,
        profile: null,
      };

      (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.unbanUser(userId);

      expect(result).toEqual(
        expect.objectContaining({
          id: userId,
          email: 'user@example.com',
          isBanned: false,
          bannedReason: null,
        })
      );
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshTokens');
    });
  });
});