import { Test, TestingModule } from '@nestjs/testing';
import { LearningProgressController } from './learning-progress.controller.js';
import { LearningProgressService } from './learning-progress.service.js';

describe('LearningProgressController', () => {
  let controller: LearningProgressController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LearningProgressController],
      providers: [LearningProgressService],
    }).compile();

    controller = module.get<LearningProgressController>(LearningProgressController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
