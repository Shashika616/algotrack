'use client';
import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { createClient } from '../lib/supabase/client';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  fileUrl: string;
  duration: number;
  fileSize?: number;
  fileFormat?: string;
  playCount: number;
  isFavorite: boolean;
  playlistId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  coverImage?: string;
  trackCount: number;
  tracks: Track[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  defaultVolume: number;
  shuffleMode: boolean;
  repeatMode: 'none' | 'one' | 'all';
}

interface MusicPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  isPlayerVisible: boolean;
  preferences: UserPreferences | null;
  loading: boolean;
  repeatMode: 'none' | 'one' | 'all';
  shuffleMode: boolean;
  togglePlayer: () => void;
  play: (track: Track, playlistId?: string) => Promise<void>;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  setVolume: (volume: number) => void;
  seek: (progress: number) => void;
  createPlaylist: (name: string, description?: string) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<void>;
  uploadTrack: (file: File, title?: string, artist?: string, playlistId?: string) => Promise<Track>;
  deleteTrack: (id: string) => Promise<void>;
  loadPlaylists: () => Promise<void>;
  loadTracks: (playlistId: string, forceRefresh?: boolean) => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  logListeningHistory: (trackId: string, playlistId?: string, progress?: number, completed?: boolean) => Promise<void>;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = useRef(createClient()).current;
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [shuffleMode, setShuffleMode] = useState(false);
  const [shuffledPlaylist, setShuffledPlaylist] = useState<Track[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const tracksLoadedRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);
  const trackCache = useRef<Map<string, Track[]>>(new Map());
  const isLoadingRef = useRef(false);

  // ─── Store mutable playback state in refs so the `ended` handler
  //     always reads the *current* value, not a stale closure snapshot.
  const repeatModeRef = useRef(repeatMode);
  const shuffleModeRef = useRef(shuffleMode);
  const currentTrackRef = useRef<Track | null>(null);
  const currentPlaylistRef = useRef<Playlist | null>(null);
  const shuffledPlaylistRef = useRef<Track[]>([]);
  const volumeRef = useRef(volume);

  // Keep refs in sync with state
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { shuffleModeRef.current = shuffleMode; }, [shuffleMode]);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
  useEffect(() => { currentPlaylistRef.current = currentPlaylist; }, [currentPlaylist]);
  useEffect(() => { shuffledPlaylistRef.current = shuffledPlaylist; }, [shuffledPlaylist]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  // ─── Auth state — independent of audio setup and data loading below.
  useEffect(() => {
  console.time('auth-check');
  supabase.auth.getUser().then(({ data: { user } }) => {
    console.timeEnd('auth-check');
    setIsAuthenticated(!!user);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    console.log('auth state change fired:', _event, !!session?.user);
    setIsAuthenticated(!!session?.user);
  });

  return () => subscription.unsubscribe();
}, []);

  // ─── playNextTrackRef is a stable ref that the `ended` listener calls.
  //     It reads all playback state from refs (never stale).
  const playNextTrackRef = useRef<() => void>(() => {});

  // ─── Stable `playTrack` that doesn't depend on other callbacks (avoids circular deps)
  const playTrackInternal = useCallback(async (track: Track, playlist: Playlist | null) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      if (!audioRef.current) return;

      if (playlist) {
        setCurrentPlaylist(playlist);
        currentPlaylistRef.current = playlist;
      }
      setCurrentTrack(track);
      currentTrackRef.current = track;
      setProgress(0);

      audioRef.current.src = track.fileUrl;
      audioRef.current.load();

      await new Promise(resolve => setTimeout(resolve, 100));

      if (!audioRef.current) return;
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setIsPlayerVisible(true);

        // Fire-and-forget history log
        fetch('/api/music/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId: track.id, playlistId: playlist?.id || track.playlistId, progress: 0, completed: false }),
        }).catch(console.error);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // Expected when switching tracks quickly
        } else {
          console.error('Error playing audio:', err);
          setIsPlaying(false);
        }
      }
    } finally {
      isLoadingRef.current = false;
    }
  }, []);

  // ─── Stable `ended` handler — reads everything from refs, no deps needed.
  //     Assigned to playNextTrackRef so the event listener is never re-attached.
  useEffect(() => {
    playNextTrackRef.current = () => {
      const mode = repeatModeRef.current;
      const track = currentTrackRef.current;
      const playlist = currentPlaylistRef.current;
      const shuffled = shuffledPlaylistRef.current;
      const isShuffle = shuffleModeRef.current;

      if (!track || !playlist) return;

      // Repeat one: restart same track
      if (mode === 'one') {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(console.error);
          setIsPlaying(true);
        }
        return;
      }

      // Pick track list
      const tracks = isShuffle && shuffled.length > 0 ? shuffled : playlist.tracks;
      if (!tracks || tracks.length === 0) {
        setIsPlaying(false);
        setProgress(0);
        return;
      }

      const currentIndex = tracks.findIndex(t => t.id === track.id);
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % tracks.length;

      // End of list and repeat is off → stop
      if (nextIndex === 0 && mode === 'none') {
        setIsPlaying(false);
        setProgress(0);
        if (audioRef.current) audioRef.current.currentTime = 0;
        return;
      }

      // ─── Regenerate shuffle order each time we wrap around
      if (isShuffle && nextIndex === 0) {
        const reshuffled = [...tracks];
        for (let i = reshuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [reshuffled[i], reshuffled[j]] = [reshuffled[j], reshuffled[i]];
        }
        setShuffledPlaylist(reshuffled);
        shuffledPlaylistRef.current = reshuffled;
        playTrackInternal(reshuffled[0], playlist);
        return;
      }

      playTrackInternal(tracks[nextIndex], playlist);
    };
  }); // Intentionally no dep array — we want this to capture latest refs on every render
      // but the listener itself is never re-attached (it just calls playNextTrackRef.current)

  // ─── One-time audio element setup — runs ONCE on mount, never tied to auth.
  //     An <audio> with no src does not fire a real error event on creation,
  //     so this is safe to set up before authentication resolves. The error
  //     listener also ignores spurious events fired when src is empty.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    audioRef.current = new Audio();
    audioRef.current.volume = volumeRef.current / 100;

    audioRef.current.addEventListener('ended', () => {
      playNextTrackRef.current();
    });

    audioRef.current.addEventListener('error', (e) => {
      // Ignore spurious error events fired before any track has been loaded
      // (empty/placeholder src resolves to the page URL itself).
      const el = audioRef.current;
      if (!el || !el.src || el.src === window.location.href) {
        return;
      }
      console.error('Audio error:', e);
      setIsPlaying(false);
    });

    audioRef.current.addEventListener('timeupdate', () => {
      if (audioRef.current?.duration) {
        setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
      }
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  // ─── Separate effect: fetch playlists/preferences once auth resolves true.
  //     Decoupled from audio setup so the audio element is never torn down
  //     or recreated when login state changes.
  useEffect(() => {
    if (isAuthenticated && isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      loadPlaylists();
      loadPreferences();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Sync preferences → state on load
  useEffect(() => {
    if (preferences) {
      setRepeatMode(preferences.repeatMode || 'none');
      setShuffleMode(preferences.shuffleMode || false);
    }
  }, [preferences]);

  // ─── Public `play` — builds shuffled list if needed, then delegates
  const play = useCallback(async (track: Track, playlistId?: string) => {
    if (isLoadingRef.current) return;

    const resolvedPlaylistId = playlistId || track.playlistId;
    const playlist = playlists.find(p => p.id === resolvedPlaylistId) || currentPlaylistRef.current;

    if (shuffleModeRef.current && playlist && playlist.tracks.length > 0) {
      const shuffled = [...playlist.tracks];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setShuffledPlaylist(shuffled);
      shuffledPlaylistRef.current = shuffled;
    }

    await playTrackInternal(track, playlist);
  }, [playlists, playTrackInternal]);

  const loadPlaylists = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/music/playlists');
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data);
        if (data.length > 0 && !currentPlaylistRef.current) {
          setCurrentPlaylist(data[0]);
        }
      }
    } catch (err) {
      console.error('Error loading playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTracks = useCallback(async (playlistId: string, forceRefresh = false) => {
    if (forceRefresh) {
      trackCache.current.delete(playlistId);
      tracksLoadedRef.current.delete(playlistId);
    }

    if (!forceRefresh && trackCache.current.has(playlistId)) {
      const cachedTracks = trackCache.current.get(playlistId)!;
      setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, tracks: cachedTracks, trackCount: cachedTracks.length } : p));
      setCurrentPlaylist(prev => prev?.id === playlistId ? { ...prev, tracks: cachedTracks, trackCount: cachedTracks.length } : prev);
      return;
    }

    if (!forceRefresh && tracksLoadedRef.current.has(playlistId)) return;

    try {
      const response = await fetch(`/api/music/tracks?playlistId=${playlistId}`);
      if (response.ok) {
        const data = await response.json();
        trackCache.current.set(playlistId, data);
        tracksLoadedRef.current.add(playlistId);
        setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, tracks: data, trackCount: data.length } : p));
        setCurrentPlaylist(prev => prev?.id === playlistId ? { ...prev, tracks: data, trackCount: data.length } : prev);
      }
    } catch (err) {
      console.error('Error loading tracks:', err);
    }
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/music/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
        setRepeatMode(data.repeatMode || 'none');
        setShuffleMode(data.shuffleMode || false);
        const vol = data.defaultVolume || 80;
        setVolumeState(vol);
        volumeRef.current = vol;
        if (audioRef.current) audioRef.current.volume = vol / 100;
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  };

  const togglePlayer = useCallback(() => setIsPlayerVisible(v => !v), []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      const track = currentTrackRef.current;
      if (track && audioRef.current.currentTime) {
        const prog = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        fetch('/api/music/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId: track.id, playlistId: track.playlistId, progress: prog || 0, completed: false }),
        }).catch(console.error);
      }
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      pause();
    } else if (currentTrackRef.current) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          if (!(err instanceof DOMException && err.name === 'AbortError')) {
            console.error('togglePlay error:', err);
            setIsPlaying(false);
          }
        });
    }
  }, [isPlaying, pause]);

  const next = useCallback(() => {
    if (isLoadingRef.current) return;
    playNextTrackRef.current();
  }, []);

  const previous = useCallback(() => {
    if (isLoadingRef.current) return;
    const playlist = currentPlaylistRef.current;
    const track = currentTrackRef.current;
    if (!playlist || !track) return;

    const tracks = shuffleModeRef.current && shuffledPlaylistRef.current.length > 0
      ? shuffledPlaylistRef.current
      : playlist.tracks;
    if (!tracks.length) return;

    const idx = tracks.findIndex(t => t.id === track.id);
    const prevIndex = idx <= 0 ? tracks.length - 1 : idx - 1;
    playTrackInternal(tracks[prevIndex], playlist);
  }, [playTrackInternal]);

  const setVolume = useCallback((newVolume: number) => {
    const clamped = Math.min(100, Math.max(0, newVolume));
    setVolumeState(clamped);
    volumeRef.current = clamped;
    if (audioRef.current) audioRef.current.volume = clamped / 100;
    updatePreferences({ defaultVolume: clamped });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seek = useCallback((newProgress: number) => {
    if (audioRef.current?.duration) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
      setProgress(newProgress);
    }
  }, []);

  const createPlaylist = useCallback(async (name: string, description?: string): Promise<Playlist> => {
    const response = await fetch('/api/music/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, isPublic: false }),
    });
    if (!response.ok) throw new Error('Failed to create playlist');
    const playlist = await response.json();
    await loadPlaylists();
    return { ...playlist, tracks: [], trackCount: 0 };
  }, []);

  const deletePlaylist = useCallback(async (id: string) => {
    const response = await fetch(`/api/music/playlists?id=${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete playlist');
    await loadPlaylists();
    if (currentPlaylistRef.current?.id === id) {
      setCurrentPlaylist(null);
      if (currentTrackRef.current) { pause(); setCurrentTrack(null); }
    }
  }, [pause]);

  const uploadTrack = useCallback(async (file: File, title?: string, artist?: string, playlistId?: string): Promise<Track> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || '');
    formData.append('artist', artist || '');
    formData.append('playlistId', playlistId || currentPlaylistRef.current?.id || '');
    const response = await fetch('/api/music/tracks', { method: 'POST', body: formData });
    if (!response.ok) throw new Error('Failed to upload track');
    const track = await response.json();
    const id = playlistId || currentPlaylistRef.current?.id;
    if (id) { trackCache.current.delete(id); tracksLoadedRef.current.delete(id); await loadTracks(id); }
    return track;
  }, [loadTracks]);

  const deleteTrack = useCallback(async (id: string) => {
    const response = await fetch(`/api/music/tracks?id=${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete track');
    const playlist = currentPlaylistRef.current;
    if (playlist) { trackCache.current.delete(playlist.id); tracksLoadedRef.current.delete(playlist.id); await loadTracks(playlist.id); }
    if (currentTrackRef.current?.id === id) { pause(); setCurrentTrack(null); }
  }, [loadTracks, pause]);

  const updatePreferences = useCallback(async (prefs: Partial<UserPreferences>) => {
    try {
      const response = await fetch('/api/music/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (response.ok) setPreferences(await response.json());
    } catch (err) {
      console.error('Error updating preferences:', err);
    }
  }, []);

  const logListeningHistory = useCallback(async (trackId: string, playlistId?: string, progress?: number, completed?: boolean) => {
    try {
      await fetch('/api/music/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, playlistId, progress: progress || 0, completed: completed || false }),
      });
    } catch (err) {
      console.error('Error logging history:', err);
    }
  }, []);

  const toggleRepeat = useCallback(() => {
    const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
    const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(next);
    repeatModeRef.current = next;
    updatePreferences({ repeatMode: next });
  }, [repeatMode, updatePreferences]);

  const toggleShuffle = useCallback(() => {
    const next = !shuffleMode;
    setShuffleMode(next);
    shuffleModeRef.current = next;
    updatePreferences({ shuffleMode: next });

    if (next) {
      const playlist = currentPlaylistRef.current;
      if (playlist && playlist.tracks.length > 0) {
        const shuffled = [...playlist.tracks];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setShuffledPlaylist(shuffled);
        shuffledPlaylistRef.current = shuffled;
      }
    } else {
      setShuffledPlaylist([]);
      shuffledPlaylistRef.current = [];
    }
  }, [shuffleMode, updatePreferences]);

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack, isPlaying, progress, volume, playlists, currentPlaylist,
        isPlayerVisible, preferences, loading, repeatMode, shuffleMode,
        togglePlayer, play, pause, togglePlay, next, previous, setVolume, seek,
        createPlaylist, deletePlaylist, uploadTrack, deleteTrack, loadPlaylists,
        loadTracks, updatePreferences, logListeningHistory, toggleRepeat, toggleShuffle,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  return context;
}