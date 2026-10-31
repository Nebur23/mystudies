import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service.js';
import { CoursesController } from './courses.controller.js';
import { LearningProgressModule } from '../learning-progress/learning-progress.module.js';

@Module({
  imports: [LearningProgressModule],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
