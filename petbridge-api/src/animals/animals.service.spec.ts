import { Test, TestingModule } from '@nestjs/testing';
import { AnimalsService } from './animals.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from './cloudinary/cloudinary.service';

describe('AnimalsService', () => {
  let service: AnimalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnimalsService,
        {
          provide: PrismaService,
          useValue: {
            animal: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: CloudinaryService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AnimalsService>(AnimalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});