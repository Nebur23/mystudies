export type CurrentUser = {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null | undefined;
    role: string | null | undefined;
}



export interface MediaPlayerProps {
  url: string;
  lessonId: string;
  initialWatched: number;
  isCompleted: boolean;
  onComplete: (lessonId: string, watchedSeconds: number) => void;
  onProgress: (lessonId: string, watchedSeconds: number) => void;
  playerConfig?: Record<string, unknown>;
  light?: boolean | string;
  className?: string;
}