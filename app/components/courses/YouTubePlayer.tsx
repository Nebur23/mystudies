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
      controls
      light={false}
      playerConfig={{
        youtube: {
          color: "white",
          playerVars: { modestbranding: 1, rel: 0, iv_load_policy: 3 },
        },
      }}
    />
  );
}