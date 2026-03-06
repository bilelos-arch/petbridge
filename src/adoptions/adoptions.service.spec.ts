import { Test, TestingModule } from '@nestjs/testing';
import { AdoptionsService } from './adoptions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdoptionsService', () => {
  let service: AdoptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdoptionsService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AdoptionsService>(AdoptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
