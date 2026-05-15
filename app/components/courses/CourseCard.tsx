import { Link } from "react-router";
import { BookOpen, CheckCircle2, Play, ChevronRight } from "lucide-react";

interface Props {
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnailUrl?: string;
    level: "olevel" | "alevel";
    subject: string;
  };
  progress?: {
    completed: number;
    total: number;
  };
}

export function CourseCard({ course, progress }: Props) {
  const progressPercent = progress?.total 
    ? Math.round((progress.completed / progress.total) * 100) 
    : 0;
    
  const isCompleted = progress?.completed === progress?.total && progress?.total as number > 0;
  const isInProgress = progressPercent > 0 && progressPercent < 100;

  return (
    <Link
      to={`/courses/${course.slug}`}
      className="block bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-purple-300 hover:shadow-md transition-all active:scale-[0.98]"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-200">
        {course.thumbnailUrl ? (
          <img 
            src={course.thumbnailUrl} 
            alt={course.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-purple-100 to-blue-100">
            <BookOpen size={32} className="text-purple-400" />
          </div>
        )}
        
        {/* Level Badge */}
        <span className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] font-bold rounded uppercase">
          {course.level === "olevel" ? "O-Level" : "A-Level"}
        </span>
        
        {/* Completion Badge */}
        {isCompleted && (
          <div className="absolute top-2 right-2 bg-green-500 text-white p-1.5 rounded-full">
            <CheckCircle2 size={14} />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 line-clamp-1">{course.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{course.subject}</p>
          </div>
          <ChevronRight size={18} className="text-slate-400 shrink-0 mt-1" />
        </div>
        
        <p className="text-sm text-slate-600 mt-2 line-clamp-2">
          {course.description}
        </p>
        
        {/* Progress Bar */}
        {progress?.total ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>{progress.completed}/{progress.total} lessons</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  isCompleted ? "bg-green-500" : "bg-purple-600"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <Play size={12} /> Start Learning
          </div>
        )}
        
        {/* CTA Button (Mobile Optimized) */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          {isInProgress ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600">
              <Play size={14} className="fill-current" /> Continue Learning
            </span>
          ) : isCompleted ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
              <CheckCircle2 size={14} /> Review Course
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
              View Course <ChevronRight size={14} />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}