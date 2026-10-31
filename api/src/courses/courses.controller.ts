import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CoursesService } from './courses.service.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Session } from '@thallesp/nestjs-better-auth';


@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  findAll(
    @Session() session: UserSession,
    @Query('search') search: string,
    @Query('level') level: string,
    @Query('subject') subject: string,
  ) {
    return this.coursesService.findAll(search, level, subject, session);
  }

  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string, @Session() session: UserSession) {
    return this.coursesService.findBySlug(slug, session);
  }

 // @Get(':id')
  //findOne(@Param('id') id: string) 
  @Get("/one")
  findOne()
  {
    return this.coursesService.findOne(1);
    //return this.coursesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(+id, updateCourseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(+id);
  }
}
