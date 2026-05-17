import { MediaPlayer } from "./MediaPlayer";

interface Props {
  videoId:        string;
  lessonId:       string;
  initialWatched: number;
  isCompleted:    boolean;
  onComplete:     (lessonId: string, watchedSeconds: number) => void;
  onProgress:     (lessonId: string, watchedSeconds: number) => void;
}

export function YouTubePlayer({ videoId, lessonId, initialWatched, isCompleted, onComplete, onProgress }: Props) {
  return (
    <MediaPlayer
      url={`https://www.youtube.com/watch?v=${videoId}`}
      lessonId={lessonId}
      initialWatched={initialWatched}
      isCompleted={isCompleted}
      onComplete={onComplete}
      onProgress={onProgress}
      light={false}
   
    />
  );
}