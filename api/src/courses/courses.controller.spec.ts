import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { CoursesController } from './courses.controller.js';
import { CoursesService } from './courses.service.js';
import type { UserSession } from '@thallesp/nestjs-better-auth';

describe('CoursesController', () => {
  let controller: CoursesController;
  const coursesService = {
    findAll: vi.fn(),
    findBySlug: vi.fn(),
    create: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [{ provide: CoursesService, useValue: coursesService }],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('loads course details by slug for the authenticated session', () => {
    const session = { user: { id: 'student-1' } } as UserSession;
    coursesService.findBySlug.mockReturnValue({ course: { slug: 'algebra' } });

    expect(controller.findBySlug('algebra', session)).toEqual({
      course: { slug: 'algebra' },
    });
    expect(coursesService.findBySlug).toHaveBeenCalledWith('algebra', session);
  });
});
