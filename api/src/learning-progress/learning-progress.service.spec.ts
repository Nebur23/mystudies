import { Test, TestingModule } from '@nestjs/testing';
import { LearningProgressService } from './learning-progress.service.js';

describe('LearningProgressService', () => {
  let service: LearningProgressService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LearningProgressService],
    }).compile();

    service = module.get<LearningProgressService>(LearningProgressService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
