import { Module } from '@nestjs/common';
import { LearningProgressService } from './learning-progress.service.js';
import { LearningProgressController } from './learning-progress.controller.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports:[DatabaseModule],
  controllers: [LearningProgressController],
  providers: [LearningProgressService],
  exports: [LearningProgressService], // Export the service to make it available for other modules
})
export class LearningProgressModule {}
