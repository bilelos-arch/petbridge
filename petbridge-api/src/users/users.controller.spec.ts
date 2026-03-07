import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AdminUserFiltersDto } from './dto/admin-user-filters.dto';
import { BanUserDto } from './dto/ban-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            getAdminAllUsers: jest.fn(),
            banUser: jest.fn(),
            unbanUser: jest.fn(),
            getMe: jest.fn(),
            updateMe: jest.fn(),
            upsertProfile: jest.fn(),
            getUserPublicProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAdminAllUsers', () => {
    it('should call service with filters and return result', async () => {
      const filters: AdminUserFiltersDto = { page: 1, limit: 10 };
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      (service.getAdminAllUsers as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.getAdminAllUsers(filters);

      expect(service.getAdminAllUsers).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockResult);
    });
  });

  describe('banUser', () => {
    it('should call service with id and ban dto', async () => {
      const userId = '1';
      const dto: BanUserDto = { reason: 'Spam' };
      
      const mockResult = {
        id: userId,
        email: 'user@example.com',
        isBanned: true,
        bannedReason: dto.reason,
      };

      (service.banUser as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.banUser(userId, dto);

      expect(service.banUser).toHaveBeenCalledWith(userId, dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('unbanUser', () => {
    it('should call service with id', async () => {
      const userId = '1';
      
      const mockResult = {
        id: userId,
        email: 'user@example.com',
        isBanned: false,
        bannedReason: null,
      };

      (service.unbanUser as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.unbanUser(userId);

      expect(service.unbanUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockResult);
    });
  });
});