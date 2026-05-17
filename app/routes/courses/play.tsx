import { useCallback, useRef, useState } from "react";
import ReactPlayer from "react-player";
import screenfull from 'screenfull';

import { Maximize, Pause, Play } from "lucide-react";

export default function PlayDemo() {

    const initialState = {
        src: undefined,
        pip: false,
        playing: false,
        controls: false,
        light: false,
        volume: 1,
        muted: false,
        played: 0,
        loaded: 0,
        duration: 0,
        playbackRate: 1.0,
        loop: false,
        seeking: false,
        loadedSeconds: 0,
        playedSeconds: 0,
    };

    type PlayerState = Omit<typeof initialState, 'src'> & {
        src?: string;
    };

    const [state, setState] = useState<PlayerState>(initialState);

    const playerRef = useRef<HTMLVideoElement | null>(null);

    const setPlayerRef = useCallback((player: HTMLVideoElement) => {
        if (!player) return;
        playerRef.current = player;
        console.log("player", player);
    }, []);

    const handlePlayPause = () => {
        setState(prevState => ({ ...prevState, playing: !prevState.playing }));
    };

    const handleClickFullscreen = () => {
        const reactPlayer = document.querySelector('.react-player');
        if (reactPlayer) screenfull.request(reactPlayer);
    };

    return (

        <section className="section">
            <h1>ReactPlayer Demo</h1>
            <div className="max-w-lg mx-auto bg-red-500">

                <ReactPlayer
                    slot="media"
                    className="react-player"
                    ref={setPlayerRef}
                    style={{ width: '100%', height: 'auto', aspectRatio: '16/9' }}
                    src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"

                    playing={state.playing}
                    controls={false}
                />
                <button onClick={handlePlayPause} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
                    {state.playing ? <Pause /> : <Play />}
                </button>
                <button type="button" onClick={handleClickFullscreen}>
                    <Maximize />
                </button>

            </div>


        </section>
    )
}