'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useMusicPlayer } from '../context/MusicPlayerContext';

export default function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    progress,
    volume,
    playlists,
    currentPlaylist,
    play,
    togglePlay,
    next,
    previous,
    setVolume,
    seek,
    togglePlayer,
    loadTracks,
    repeatMode,
    shuffleMode,
    toggleRepeat,
    toggleShuffle,
  } = useMusicPlayer();

  const [isMinimized, setIsMinimized] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const hasLoadedTracks = useRef<Set<string>>(new Set());

  // Sync progress from context
  useEffect(() => {
    setLocalProgress(progress);
  }, [progress]);

  // Auto-show player when a track starts, un-minimize it
  useEffect(() => {
    if (currentTrack) {
      setIsMinimized(false);
    }
  }, [currentTrack?.id]);

  // Load tracks when playlist is selected
  useEffect(() => {
    if (!selectedPlaylistId) return;
    if (hasLoadedTracks.current.has(selectedPlaylistId)) return;
    const playlist = playlists.find(p => p.id === selectedPlaylistId);
    if (playlist && (!playlist.tracks || playlist.tracks.length === 0)) {
      loadTracks(selectedPlaylistId);
      hasLoadedTracks.current.add(selectedPlaylistId);
    }
  }, [selectedPlaylistId, playlists, loadTracks]);

  // Sync selectedPlaylistId with currentPlaylist
  useEffect(() => {
    if (currentPlaylist && !selectedPlaylistId) {
      setSelectedPlaylistId(currentPlaylist.id);
    }
  }, [currentPlaylist]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const activePlaylist = selectedPlaylistId
    ? playlists.find(p => p.id === selectedPlaylistId)
    : currentPlaylist;

  const handlePlaylistSelect = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setShowPlaylistMenu(false);
    hasLoadedTracks.current.delete(playlistId);
  };

  const handlePlayTrack = (track: any) => {
    play(track, activePlaylist?.id);
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one': return '🔂';
      case 'all': return '🔁';
      default: return '↺';
    }
  };

  // ─── MINIMIZED STATE: just the floating icon, lower opacity
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="relative bg-[#FF6B35] text-white rounded-full p-3.5 shadow-lg hover:bg-[#E04E1B] transition-all opacity-40 hover:opacity-100 cursor-pointer"
          title="Open Music Player"
        >
          {/* Pulsing ring when playing */}
          {isPlaying && (
            <span className="absolute inset-0 rounded-full bg-[#FF6B35] animate-ping opacity-30" />
          )}
          <svg className="w-5 h-5 fill-current relative z-10" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15V7l6 5-6 5z"/>
          </svg>
        </button>
      </div>
    );
  }

  // ─── NO TRACK: playlist browser with minimize button
  if (!currentTrack) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">🎵 Music Library</h3>
              <div className="flex items-center gap-1">
                {/* Minimize */}
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 hover:bg-slate-100 rounded transition-colors"
                  title="Minimize"
                >
                  <svg className="w-4 h-4 stroke-slate-500" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <path d="M5 12h14" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Playlist selector */}
            <div className="mb-3">
              <button
                onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                className="w-full text-left px-3 py-2 bg-slate-50 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-between"
              >
                <span>{activePlaylist?.name || 'Select Playlist'}</span>
                <svg className={`w-4 h-4 transition-transform ${showPlaylistMenu ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showPlaylistMenu && (
                <div className="mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => handlePlaylistSelect(playlist.id)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors flex items-center justify-between ${
                        activePlaylist?.id === playlist.id ? 'bg-[#FF6B35]/10 text-[#FF6B35]' : 'text-slate-600'
                      }`}
                    >
                      <span className="truncate">{playlist.name}</span>
                      <span className="text-[10px] text-slate-400">{playlist.tracks?.length || 0} songs</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Track list */}
            <div className="overflow-y-auto max-h-64">
              {activePlaylist && activePlaylist.tracks && activePlaylist.tracks.length > 0 ? (
                <div className="space-y-1">
                  {activePlaylist.tracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => handlePlayTrack(track)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 fill-slate-400" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-700 truncate">{track.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">{track.artist}</div>
                      </div>
                      <div className="text-[10px] text-slate-400">{formatTime(track.duration)}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  {activePlaylist ? 'No tracks in this playlist' : 'Select a playlist to get started'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── PLAYING STATE: full player with minimize button
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden w-80">
      <div className="p-3">
        {/* Track info + controls row */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 truncate">{currentTrack.title}</div>
            <div className="text-[10px] text-slate-400 truncate">{currentTrack.artist}</div>
          </div>
          <div className="flex items-center gap-1">
            {/* Expand/collapse playlist */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg className={`w-4 h-4 stroke-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" strokeWidth="2">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {/* Minimize to icon */}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
              title="Minimize"
            >
              <svg className="w-4 h-4 stroke-slate-500" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                <path d="M5 12h14" strokeLinecap="round"/>
              </svg>
            </button>
 
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] text-slate-400 min-w-[28px] font-mono">
            {formatTime((localProgress / 100) * (currentTrack.duration || 0))}
          </span>
          <div className="flex-1 h-1 bg-slate-200 rounded-full cursor-pointer relative group">
            <div
              className="h-full bg-[#FF6B35] rounded-full transition-all duration-100"
              style={{ width: `${localProgress}%` }}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={localProgress}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setLocalProgress(val);
                seek(val);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>
          <span className="text-[9px] text-slate-400 min-w-[28px] font-mono">
            {formatTime(currentTrack.duration || 0)}
          </span>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-between">
          {/* Volume */}
          <div className="flex items-center gap-1">
            <button onClick={() => setVolume(volume > 0 ? 0 : 80)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
              <svg className="w-4 h-4 fill-slate-500" viewBox="0 0 24 24">
                {volume === 0
                  ? <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                  : <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                }
              </svg>
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#FF6B35]"
            />
          </div>

          {/* Shuffle / Repeat / Prev / Play / Next */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={toggleShuffle}
              className={`p-1.5 rounded-full transition-colors ${
                shuffleMode ? 'bg-[#FF6B35]/20 text-[#FF6B35]' : 'hover:bg-slate-100 text-slate-400'
              }`}
              title={shuffleMode ? 'Shuffle On' : 'Shuffle Off'}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm0.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
              </svg>
            </button>
            <button
              onClick={toggleRepeat}
              className={`p-1.5 rounded-full transition-colors text-sm ${
                repeatMode !== 'none' ? 'bg-[#FF6B35]/20 text-[#FF6B35]' : 'hover:bg-slate-100 text-slate-400'
              }`}
              title={repeatMode === 'one' ? 'Repeat One' : repeatMode === 'all' ? 'Repeat All' : 'Repeat Off'}
            >
              {getRepeatIcon()}
            </button>
            <button onClick={previous} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
              <svg className="w-4 h-4 fill-slate-600" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            <button onClick={togglePlay} className="p-2 bg-[#FF6B35] text-white rounded-full hover:bg-[#E04E1B] transition-colors">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                {isPlaying ? <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/> : <path d="M8 5v14l11-7z"/>}
              </svg>
            </button>
            <button onClick={next} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
              <svg className="w-4 h-4 fill-slate-600" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
          </div>
        </div>

        {/* Expanded playlist view */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="mb-3">
              <button
                onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                className="w-full text-left px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-between"
              >
                <span>{activePlaylist?.name || 'Select Playlist'}</span>
                <svg className={`w-4 h-4 transition-transform ${showPlaylistMenu ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showPlaylistMenu && (
                <div className="mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => handlePlaylistSelect(playlist.id)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors flex items-center justify-between ${
                        activePlaylist?.id === playlist.id ? 'bg-[#FF6B35]/10 text-[#FF6B35]' : 'text-slate-600'
                      }`}
                    >
                      <span className="truncate">{playlist.name}</span>
                      <span className="text-[10px] text-slate-400">{playlist.tracks?.length || 0}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto">
              {activePlaylist && activePlaylist.tracks && activePlaylist.tracks.length > 0 ? (
                <div className="space-y-1">
                  {activePlaylist.tracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => handlePlayTrack(track)}
                      className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-3 ${
                        currentTrack?.id === track.id ? 'bg-[#FF6B35]/5' : ''
                      }`}
                    >
                      <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                        {currentTrack?.id === track.id && isPlaying ? (
                          <div className="w-3 h-3 flex items-center justify-center gap-0.5">
                            <div className="w-0.5 h-3 bg-[#FF6B35] animate-pulse"></div>
                            <div className="w-0.5 h-2 bg-[#FF6B35] animate-pulse delay-75"></div>
                            <div className="w-0.5 h-3 bg-[#FF6B35] animate-pulse delay-150"></div>
                          </div>
                        ) : (
                          <svg className="w-3 h-3 fill-slate-400" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-700 truncate">{track.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">{track.artist}</div>
                      </div>
                      <div className="text-[10px] text-slate-400">{formatTime(track.duration)}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">No tracks in this playlist</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}