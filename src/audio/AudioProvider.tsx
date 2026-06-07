import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import { selectCurrentSong, usePlayerStore } from '../store/playerStore';
import { pickAudio, pickImage } from '../utils/music';

type AudioControls = {
  toggle: () => void;
  seek: (seconds: number) => Promise<void>;
  skipNext: () => void;
  skipPrevious: () => void;
};

const AudioContext = createContext<AudioControls | null>(null);

export function AudioProvider({ children }: PropsWithChildren) {
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const currentSong = usePlayerStore(selectCurrentSong);
  const shouldPlay = usePlayerStore((state) => state.shouldPlay);
  const repeatMode = usePlayerStore((state) => state.repeatMode);
  const audioQuality = usePlayerStore((state) => state.audioQuality);
  const setShouldPlay = usePlayerStore((state) => state.setShouldPlay);
  const setPlaybackStatus = usePlayerStore((state) => state.setPlaybackStatus);
  const next = usePlayerStore((state) => state.next);
  const previous = usePlayerStore((state) => state.previous);
  const loadedSongId = useRef<string | undefined>(undefined);
  const handledFinish = useRef(false);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
  }, []);

  useEffect(() => {
    const source = pickAudio(currentSong, audioQuality);
    if (!currentSong || !source || loadedSongId.current === currentSong.id) return;

    loadedSongId.current = currentSong.id;
    handledFinish.current = false;
    player.replace({ uri: source, name: currentSong.title });
    player.loop = repeatMode === 'one';
    player.setActiveForLockScreen(true, {
      title: currentSong.title,
      artist: currentSong.artist,
      albumTitle: currentSong.album,
      artworkUrl: pickImage(currentSong),
    });
    if (shouldPlay) player.play();
  }, [currentSong, player, repeatMode, shouldPlay, audioQuality]);

  useEffect(() => {
    player.loop = repeatMode === 'one';
  }, [player, repeatMode]);

  useEffect(() => {
    if (!currentSong) return;
    if (shouldPlay && !status.playing) player.play();
    if (!shouldPlay && status.playing) player.pause();
  }, [currentSong, player, shouldPlay, status.playing]);

  useEffect(() => {
    setPlaybackStatus({
      isPlaying: status.playing,
      isBuffering: status.isBuffering,
      position: status.currentTime,
      duration: status.duration || currentSong?.duration || 0,
    });

    if (status.didJustFinish && !handledFinish.current) {
      handledFinish.current = true;
      if (repeatMode === 'one') {
        void player.seekTo(0).then(() => player.play());
      } else {
        next();
      }
    } else if (!status.didJustFinish) {
      handledFinish.current = false;
    }
  }, [
    currentSong?.duration,
    next,
    player,
    repeatMode,
    setPlaybackStatus,
    status.currentTime,
    status.didJustFinish,
    status.duration,
    status.isBuffering,
    status.playing,
  ]);

  const toggle = useCallback(() => {
    setShouldPlay(!status.playing);
  }, [setShouldPlay, status.playing]);

  const seek = useCallback(
    async (seconds: number) => {
      await player.seekTo(seconds);
      setPlaybackStatus({ position: seconds });
    },
    [player, setPlaybackStatus],
  );

  const controls = useMemo(
    () => ({
      toggle,
      seek,
      skipNext: next,
      skipPrevious: previous,
    }),
    [next, previous, seek, toggle],
  );

  return <AudioContext.Provider value={controls}>{children}</AudioContext.Provider>;
}

export function useAudioControls() {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudioControls must be used inside AudioProvider');
  return context;
}
