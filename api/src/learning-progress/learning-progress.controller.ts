import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LearningProgressService } from './learning-progress.service.js';
import { CreateLearningProgressDto } from './dto/create-learning-progress.dto.js';
import { UpdateLearningProgressDto } from './dto/update-learning-progress.dto.js';
import { CurrentLearningProgressDto } from './dto/current-user-progress-per-course.dto.js';

@Controller('learning-progress')
export class LearningProgressController {
  constructor(private readonly learningProgressService: LearningProgressService) {}

  @Post()
  create(@Body() createLearningProgressDto: CreateLearningProgressDto) {
    return this.learningProgressService.create(createLearningProgressDto);
  }

  @Get()
  findAll() {
    return this.learningProgressService.findAll();
  }

  @Post('current-user-progress-per-course')
  findUserProgressPerCourse(
    @Body() currentUserProgressPerCourseDto: CurrentLearningProgressDto
  ) {
    //console.log('currentUserProgressPerCourseDto', currentUserProgressPerCourseDto);
    return this.learningProgressService.findUserProgressPerCourse(currentUserProgressPerCourseDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.learningProgressService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLearningProgressDto: UpdateLearningProgressDto) {
    return this.learningProgressService.update(+id, updateLearningProgressDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.learningProgressService.remove(+id);
  }
}
