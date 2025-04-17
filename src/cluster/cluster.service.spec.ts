import { Test, TestingModule } from '@nestjs/testing';
import { ClusterService } from './cluster.service';
import { ClusterRepository } from './cluster.repository';
import { BadRequestException } from '@nestjs/common';

describe('ClusterService', () => {
  let service: ClusterService;
  let repository: ClusterRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClusterService,
        {
          provide: ClusterRepository,
          useValue: {
            clusterizeData: jest.fn().mockResolvedValue([
              { centroid: [0, 0], clusterInd: [0] },
            ]),
          },
        },
      ],
    }).compile();

    service = module.get<ClusterService>(ClusterService);
    repository = module.get<ClusterRepository>(ClusterRepository);
  });

  it('should throw error if file is not provided', async () => {
    await expect(service.processCsv(null, 23)).rejects.toThrow(BadRequestException);
  });

  // Puedes agregar más tests verificando el correcto procesamiento de un CSV de ejemplo.
});