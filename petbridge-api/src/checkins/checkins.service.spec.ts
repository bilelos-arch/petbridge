import { Test, TestingModule } from '@nestjs/testing';
import { CheckInsService } from './checkins.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('CheckInsService', () => {
  let service: CheckInsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckInsService,
        {
          provide: PrismaService,
          useValue: {
            checkIn: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
            adoptionRequest: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            animal: {
              update: jest.fn(),
            },
            userProfile: {
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CheckInsService>(CheckInsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createAutoCheckIns', () => {
    it('should create 4 check-ins with correct delays and numbers', async () => {
      // Arrange
      const adoptionId = '123';
      const donneurId = '456';
      const now = new Date();
      
      (prisma.checkIn.findFirst as jest.Mock).mockResolvedValue(null); // No existing checkins
      (prisma.checkIn.create as jest.Mock).mockResolvedValue({});

      // Act
      await service.createAutoCheckIns(adoptionId, donneurId);

      // Assert
      expect(prisma.checkIn.create).toHaveBeenCalledTimes(4);
      
      // Check if the delays are 1, 3, 14, 30 days
      const calls = (prisma.checkIn.create as jest.Mock).mock.calls;
      const expectedDelays = [1, 3, 14, 30];
      
      calls.forEach((call: any, index: number) => {
        const data = call[0].data;
        expect(data.adoptionId).toBe(adoptionId);
        expect(data.requestedById).toBe(donneurId);
        expect(data.checkInNumber).toBe(index + 1);
        
        // Calculate the expected scheduled date
        const expectedDate = new Date(now);
        expectedDate.setDate(expectedDate.getDate() + expectedDelays[index]);
        
        // Check if the scheduled date is correct (allowing for 1ms difference due to date precision)
        const actualDate = new Date(data.scheduledFor);
        const timeDiff = Math.abs(actualDate.getTime() - expectedDate.getTime());
        expect(timeDiff).toBeLessThanOrEqual(1000); // Allow for 1 second tolerance
        
        // Check if dueDate is equal to scheduledFor
        expect(data.dueDate).toEqual(data.scheduledFor);
        
        // Check the message format
        expect(data.message).toContain(`J+${expectedDelays[index]}`);
        expect(data.status).toBe('EN_ATTENTE');
      });
    });

    it('should throw an error if check-ins already exist', async () => {
      // Arrange
      const adoptionId = '123';
      const donneurId = '456';
      
      (prisma.checkIn.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-checkin' });

      // Act & Assert
      await expect(service.createAutoCheckIns(adoptionId, donneurId)).rejects.toThrow(
        'Les check-ins existent déjà pour cette adoption'
      );
      
      expect(prisma.checkIn.create).not.toHaveBeenCalled();
    });
  });

  describe('respondToCheckIn', () => {
    it('should mark check-in as complete and update adoption if all check-ins are complete', async () => {
      // Arrange
      const checkInId = 'check-in-1';
      const userId = 'user-1';
      const adoptionId = 'adoption-1';
      const adopterId = 'user-1';
      const animalId = 'animal-1';
      
      // Mock check-in
      (prisma.checkIn.findUnique as jest.Mock).mockResolvedValue({
        id: checkInId,
        adoptionId,
        requestedById: 'user-2',
        status: 'EN_ATTENTE',
        adoption: {
          adopterId,
          donneurId: 'user-2',
          animalId,
        },
      });
      
      // Mock updated check-in
      (prisma.checkIn.update as jest.Mock).mockResolvedValue({
        id: checkInId,
        adoptionId,
        status: 'COMPLETE',
        adoption: { animalId },
      });
      
      // Mock all check-ins
      (prisma.checkIn.findMany as jest.Mock).mockResolvedValue([
        { status: 'COMPLETE' },
        { status: 'COMPLETE' },
        { status: 'COMPLETE' },
        { status: 'COMPLETE' },
      ]);
      
      // Mock animal and adoption updates
      (prisma.animal.update as jest.Mock).mockResolvedValue({});
      (prisma.adoptionRequest.update as jest.Mock).mockResolvedValue({});
      (prisma.userProfile.update as jest.Mock).mockResolvedValue({});

      // Act
      await service.respondToCheckIn(checkInId, userId, {
        responseNote: 'All is well',
        photoUrl: 'http://example.com/photo.jpg',
        wellbeingScore: 5,
      });

      // Assert
      expect(prisma.animal.update).toHaveBeenCalledWith({
        where: { id: animalId },
        data: { status: 'ADOPTE' },
      });
      
      expect(prisma.adoptionRequest.update).toHaveBeenCalledWith({
        where: { id: adoptionId },
        data: expect.objectContaining({
          status: 'COMPLETEE',
        }),
      });
      
      expect(prisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId: adopterId },
        data: { completionBadge: true },
      });
    });
  });

  describe('checkLateCheckIns', () => {
    it('should mark late check-ins and update user profiles', async () => {
      // Arrange
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 3); // 3 days ago to be definitely late
      
      const lateCheckIns = [
        {
          id: 'check-in-1',
          adoption: { adopterId: 'user-1' },
        },
        {
          id: 'check-in-2',
          adoption: { adopterId: 'user-2' },
        },
      ];
      
      (prisma.checkIn.findMany as jest.Mock).mockResolvedValue(lateCheckIns);
      (prisma.checkIn.update as jest.Mock).mockResolvedValue({});
      (prisma.userProfile.update as jest.Mock).mockResolvedValue({});

      // Act
      const lateCount = await service.checkLateCheckIns();

      // Assert
      expect(lateCount).toBe(2);
      expect(prisma.checkIn.update).toHaveBeenCalledTimes(2);
      expect(prisma.userProfile.update).toHaveBeenCalledTimes(2);
      
      lateCheckIns.forEach((checkIn) => {
        expect(prisma.checkIn.update).toHaveBeenCalledWith({
          where: { id: checkIn.id },
          data: { isLate: true },
        });
        
        expect(prisma.userProfile.update).toHaveBeenCalledWith({
          where: { userId: checkIn.adoption.adopterId },
          data: {
            warningCount: { increment: 1 },
            warningBadge: true,
          },
        });
      });
    });
  });
});