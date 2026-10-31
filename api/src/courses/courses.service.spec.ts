import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { DATABASE_CONNECTION } from '../database/database.connection.js';
import { LearningProgressService } from '../learning-progress/learning-progress.service.js';
import { CoursesService } from './courses.service.js';

describe('CoursesService', () => {
  let service: CoursesService;
  let learningProgressService: { findUserProgressPerCourse: ReturnType<typeof vi.fn> };

  const courses = [{
    id: 'course-1',
    title: 'Algebra',
    slug: 'algebra',
    description: null,
    thumbnailUrl: null,
    level: 'alevel',
    subject: 'Mathematics',
  }];

  beforeEach(async () => {
    learningProgressService = {
      findUserProgressPerCourse: vi.fn(),
    };

    const query = {
      orderBy: vi.fn().mockResolvedValue(courses),
    };
    const selection = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(query),
      }),
    };
    const distinctSelection = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          { level: 'alevel', subject: 'Mathematics' },
        ]),
      }),
    };
    const database = {
      select: vi.fn().mockReturnValue(selection),
      selectDistinct: vi.fn().mockReturnValue(distinctSelection),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: DATABASE_CONNECTION, useValue: database },
        { provide: LearningProgressService, useValue: learningProgressService },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('returns published courses when no user session is available', async () => {
    await expect(service.findAll()).resolves.toEqual({
      courses,
      courseProgressMap: {
        'course-1': { completed: 0, total: 0 },
      },
      availableFilters: {
        levels: ['alevel'],
        subjects: ['Mathematics'],
      },
    });
    expect(learningProgressService.findUserProgressPerCourse).not.toHaveBeenCalled();
  });
});
