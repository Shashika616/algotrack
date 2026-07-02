'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useMusicPlayer } from '../../../context/MusicPlayerContext';

const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks

interface UploadQueueItem {
  id: string;
  file: File;
  title: string;
  artist: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

type ModalType = 'deleteTrack' | 'deletePlaylist' | null;

export default function MusicPage() {
  const {
    currentTrack,
    isPlaying,
    progress,
    volume,
    playlists,
    currentPlaylist,
    loading,
    play,
    togglePlay,
    next,
    previous,
    setVolume,
    seek,
    createPlaylist,
    deletePlaylist,
    uploadTrack,
    deleteTrack,
    loadTracks,
    loadPlaylists,
    togglePlayer,
  } = useMusicPlayer();

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalData, setModalData] = useState<{ id: string; name: string; type: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadIdCounter = useRef(0);

  const activePlaylist = selectedPlaylistId
    ? playlists.find(p => p.id === selectedPlaylistId)
    : currentPlaylist;

  // Load tracks when the selected playlist changes — normal (cached) load
  useEffect(() => {
    if (!activePlaylist) return;
    loadTracks(activePlaylist.id);
  }, [activePlaylist?.id, loadTracks]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCreatePlaylist = async () => {
    if (newPlaylistName.trim()) {
      const playlist = await createPlaylist(newPlaylistName.trim(), newPlaylistDescription.trim() || undefined);
      setSelectedPlaylistId(playlist.id);
      setShowCreatePlaylist(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newQueueItems: UploadQueueItem[] = Array.from(files).map((file) => ({
        id: `upload-${++uploadIdCounter.current}`,
        file,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: '',
        progress: 0,
        status: 'pending',
      }));
      setUploadQueue(prev => [...prev, ...newQueueItems]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── FIX: forceRefresh=true bypasses both caches in the context,
  //         guaranteeing the newly uploaded tracks are fetched from the server.
  const refreshPlaylist = async (playlistId?: string) => {
    const id = playlistId || activePlaylist?.id;
    if (!id) return;
    setIsRefreshing(true);
    try {
      await loadTracks(id, true); // <-- force-busts both trackCache and tracksLoadedRef
    } catch (err) {
      console.error('Error refreshing playlist:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const uploadFileInChunks = async (
    file: File,
    playlistId: string,
    queueItemId: string,
    onProgress: (progress: number) => void,
    title?: string,
    artist?: string
  ) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    onProgress(0);

    const initFormData = new FormData();
    initFormData.append('fileName', file.name);
    initFormData.append('totalChunks', totalChunks.toString());
    initFormData.append('fileSize', file.size.toString());

    const initResponse = await fetch('/api/music/upload-chunk', {
      method: 'POST',
      body: initFormData,
    });
    if (!initResponse.ok) {
      const errorData = await initResponse.json();
      throw new Error(errorData.error || 'Failed to initialize upload');
    }
    const { uploadId } = await initResponse.json();

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const chunkFormData = new FormData();
      chunkFormData.append('chunk', chunk);
      chunkFormData.append('uploadId', uploadId);
      chunkFormData.append('chunkIndex', i.toString());

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const chunkResponse = await fetch('/api/music/upload-chunk', {
          method: 'PUT',
          body: chunkFormData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!chunkResponse.ok) {
          const errorData = await chunkResponse.json();
          throw new Error(errorData.error || `Failed to upload chunk ${i + 1}`);
        }
        onProgress(Math.round(((i + 1) / totalChunks) * 80));
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error(`Chunk ${i + 1} upload timed out. Please try again.`);
        }
        throw fetchError;
      }
    }

    onProgress(85);

    const completeResponse = await fetch('/api/music/upload-chunk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId,
        fileName: file.name,
        playlistId,
        title: title || undefined,
        artist: artist || undefined,
      }),
    });
    if (!completeResponse.ok) {
      const errorData = await completeResponse.json();
      throw new Error(errorData.error || 'Failed to complete upload');
    }

    const track = await completeResponse.json();
    onProgress(90);

    // Try to patch the duration on the server
    try {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      audio.src = url;
      await new Promise((resolve) => {
        audio.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(null); };
        audio.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
        setTimeout(() => { URL.revokeObjectURL(url); resolve(null); }, 5000);
      });
      if (audio.duration && audio.duration > 0) {
        await fetch(`/api/music/tracks/${track.id}/duration`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ duration: Math.round(audio.duration) }),
        });
        track.duration = Math.round(audio.duration);
      }
    } catch (err) {
      console.warn('Could not get audio duration:', err);
    }

    onProgress(100);
    return track;
  };

  const processUploadQueue = async () => {
    if (isUploading) return;
    if (!activePlaylist) {
      alert('Please select a playlist first');
      return;
    }

    const pendingItems = uploadQueue.filter(item => item.status === 'pending');
    if (pendingItems.length === 0) return;

    setIsUploading(true);

    const concurrencyLimit = 3;
    const batches: UploadQueueItem[][] = [];
    for (let i = 0; i < pendingItems.length; i += concurrencyLimit) {
      batches.push(pendingItems.slice(i, i + concurrencyLimit));
    }

    const playlistId = activePlaylist.id;

    for (const batch of batches) {
      await Promise.all(
        batch.map(async (item) => {
          try {
            setUploadQueue(prev =>
              prev.map(q => q.id === item.id ? { ...q, status: 'uploading', progress: 0 } : q)
            );

            await uploadFileInChunks(
              item.file,
              playlistId,
              item.id,
              (p) => setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: p } : q)),
              item.title || undefined,
              item.artist || undefined
            );

            setUploadQueue(prev =>
              prev.map(q => q.id === item.id ? { ...q, status: 'complete', progress: 100 } : q)
            );

            // ─── FIX: Refresh immediately after each file completes so the
            //         track appears in the list without waiting for the whole batch.
            await refreshPlaylist(playlistId);
          } catch (err) {
            console.error('Upload failed for:', item.file.name, err);
            setUploadQueue(prev =>
              prev.map(q => q.id === item.id ? { ...q, status: 'error', error: (err as Error).message } : q)
            );
          }
        })
      );
    }

    setTimeout(() => {
      setUploadQueue(prev => prev.filter(item => item.status !== 'complete'));
    }, 3000);

    setIsUploading(false);
  };

  const removeFromQueue = (id: string) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id));
  };

  const openDeleteTrackModal = (trackId: string, trackName: string) => {
    setModalType('deleteTrack');
    setModalData({ id: trackId, name: trackName, type: 'track' });
  };

  const openDeletePlaylistModal = (playlistId: string, playlistName: string) => {
    setModalType('deletePlaylist');
    setModalData({ id: playlistId, name: playlistName, type: 'playlist' });
  };

  const closeModal = () => {
    setModalType(null);
    setModalData(null);
  };

  const confirmDelete = async () => {
    if (!modalData) return;
    try {
      if (modalType === 'deleteTrack') {
        await deleteTrack(modalData.id);
        await refreshPlaylist();
      } else if (modalType === 'deletePlaylist') {
        await deletePlaylist(modalData.id);
        setSelectedPlaylistId(null);
      }
      closeModal();
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Failed to delete. Please try again.');
    }
  };

  const handlePlayTrack = (track: any) => {
    play(track, activePlaylist?.id);
  };

  const handleDeletePlaylistClick = () => {
    if (activePlaylist && activePlaylist.name !== 'My Library') {
      openDeletePlaylistModal(activePlaylist.id, activePlaylist.name);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-sm text-slate-400">Loading your music...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">🎵 Music Library</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage your music, create playlists, and listen while you code</p>
        </div>
        <button
          onClick={togglePlayer}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#FF6B35] hover:bg-[#E04E1B] text-white transition-all shadow-sm shadow-orange-500/10 cursor-pointer"
        >
          {currentTrack ? '🎵 Now Playing' : '🎵 Open Player'}
        </button>
      </div>

      {/* Now Playing Bar */}
      {currentTrack && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-800 truncate">{currentTrack.title}</div>
              <div className="text-xs text-slate-400 truncate">{currentTrack.artist}</div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={previous} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <svg className="w-5 h-5 fill-slate-600" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
              </button>
              <button onClick={togglePlay} className="p-3 bg-[#FF6B35] text-white rounded-full hover:bg-[#E04E1B] transition-colors">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  {isPlaying ? <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/> : <path d="M8 5v14l11-7z"/>}
                </svg>
              </button>
              <button onClick={next} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <svg className="w-5 h-5 fill-slate-600" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
              </button>
            </div>
            <div className="w-32 flex items-center gap-2">
              <span className="text-[10px] text-slate-400">{formatTime((progress / 100) * (currentTrack.duration || 0))}</span>
              <div className="flex-1 h-1 bg-slate-200 rounded-full">
                <div className="h-full bg-[#FF6B35] rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[10px] text-slate-400">{formatTime(currentTrack.duration || 0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Playlists Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Playlists</h3>
              <button onClick={() => setShowCreatePlaylist(true)} className="text-xs text-[#FF6B35] hover:text-[#E04E1B] font-semibold">
                + New
              </button>
            </div>

            {showCreatePlaylist && (
              <div className="mb-3 p-3 bg-slate-50 rounded-lg space-y-2">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name"
                  className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-[#FF6B35]"
                />
                <input
                  type="text"
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-[#FF6B35]"
                />
                <div className="flex gap-2">
                  <button onClick={handleCreatePlaylist} className="flex-1 px-3 py-1.5 text-xs font-semibold bg-[#FF6B35] text-white rounded hover:bg-[#E04E1B] transition-colors">
                    Create
                  </button>
                  <button onClick={() => setShowCreatePlaylist(false)} className="px-3 py-1.5 text-xs font-semibold bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => setSelectedPlaylistId(playlist.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all text-xs ${
                    selectedPlaylistId === playlist.id || (!selectedPlaylistId && currentPlaylist?.id === playlist.id)
                      ? 'bg-[#FF6B35]/10 text-[#FF6B35] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{playlist.name}</span>
                    <span className="text-[10px] text-slate-400">{playlist.tracks?.length ?? playlist.trackCount ?? 0}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tracks Area */}
        <div className="md:col-span-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {activePlaylist ? activePlaylist.name : 'Select a playlist'}
                </h3>
                {activePlaylist?.description && (
                  <p className="text-xs text-slate-400">{activePlaylist.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activePlaylist && (
                  <button
                    onClick={() => refreshPlaylist()}
                    disabled={isRefreshing}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      isRefreshing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-500 hover:text-[#FF6B35]'
                    }`}
                    title="Refresh playlist"
                  >
                    <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
                {activePlaylist && activePlaylist.name !== 'My Library' && (
                  <button onClick={handleDeletePlaylistClick} className="text-xs text-red-400 hover:text-red-600 transition-colors">
                    Delete Playlist
                  </button>
                )}
              </div>
            </div>

            {/* Upload Section */}
            {activePlaylist && (
              <div className="mb-4 p-4 bg-gradient-to-r from-orange-50/50 to-slate-50 rounded-xl border-2 border-dashed border-orange-200/70">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="cursor-pointer">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white text-sm font-semibold rounded-lg shadow-lg shadow-orange-500/40 hover:shadow-orange-500/60 hover:bg-[#E04E1B] transition-all duration-300 cursor-pointer">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
                        </svg>
                        Choose Files
                      </div>
                    </label>
                    <span className="text-xs text-slate-400">Supports MP3, WAV, OGG, FLAC (Max 100MB each)</span>
                    {uploadQueue.filter(q => q.status === 'pending' || q.status === 'uploading').length > 0 && (
                      <button
                        onClick={processUploadQueue}
                        disabled={isUploading || !activePlaylist}
                        className="px-4 py-1.5 text-xs font-semibold bg-[#FF6B35] text-white rounded-lg hover:bg-[#E04E1B] transition-all disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md shadow-orange-500/30 hover:shadow-orange-500/50"
                      >
                        {isUploading
                          ? `Uploading (${uploadQueue.filter(q => q.status === 'uploading' || q.status === 'pending').length} left)...`
                          : `Upload All (${uploadQueue.filter(q => q.status === 'pending').length})`}
                      </button>
                    )}
                  </div>

                  {uploadQueue.length > 0 && (
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {uploadQueue.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-700 truncate">{item.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                              {item.status === 'uploading' ? (
                                <>
                                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#FF6B35] rounded-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
                                  </div>
                                  <span className="text-[10px] text-slate-500 min-w-[36px]">{item.progress}%</span>
                                </>
                              ) : item.status === 'pending' ? (
                                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-slate-300 rounded-full w-0" />
                                </div>
                              ) : item.status === 'complete' ? (
                                <div className="flex-1 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full w-full" />
                                </div>
                              ) : (
                                <div className="flex-1 h-1.5 bg-red-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-red-500 rounded-full w-full" />
                                </div>
                              )}
                            </div>
                            {item.status === 'error' && (
                              <div className="text-[10px] text-red-500 truncate">{item.error}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {item.status === 'pending' && <span className="text-[10px] text-slate-400">Pending</span>}
                            {item.status === 'uploading' && <span className="text-[10px] text-[#FF6B35] font-medium">Uploading...</span>}
                            {item.status === 'complete' && <span className="text-[10px] text-emerald-500 font-medium">✓ Done</span>}
                            {item.status === 'error' && <span className="text-[10px] text-red-500 font-medium">✗ Failed</span>}
                            {item.status !== 'uploading' && (
                              <button onClick={() => removeFromQueue(item.id)} className="text-slate-400 hover:text-red-500 transition-colors">✕</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tracks List */}
            {activePlaylist && activePlaylist.tracks && activePlaylist.tracks.length > 0 ? (
              <div className="space-y-1">
                {activePlaylist.tracks.map((track) => (
                  <div
                    key={track.id}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer group ${
                      currentTrack?.id === track.id ? 'bg-[#FF6B35]/10' : 'hover:bg-slate-50'
                    }`}
                  >
                    <button onClick={() => handlePlayTrack(track)} className="p-1.5 rounded-full hover:bg-white/50 transition-colors">
                      <svg className="w-4 h-4 fill-slate-600" viewBox="0 0 24 24">
                        {currentTrack?.id === track.id && isPlaying
                          ? <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                          : <path d="M8 5v14l11-7z"/>}
                      </svg>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">{track.title}</div>
                      <div className="text-xs text-slate-400 truncate">{track.artist}</div>
                    </div>
                    <div className="text-xs text-slate-400">{formatTime(track.duration)}</div>
                    <div className="text-[10px] text-slate-400">{track.playCount || 0} plays</div>
                    <button
                      onClick={() => openDeleteTrackModal(track.id, track.title)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-slate-400">
                {activePlaylist ? 'No tracks in this playlist. Upload some music!' : 'Select or create a playlist to get started.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Track Modal */}
      {modalType === 'deleteTrack' && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Delete Track</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              Are you sure you want to delete "<span className="font-semibold text-slate-700">{modalData.name}</span>"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all shadow-sm shadow-red-500/30">Delete Track</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Playlist Modal */}
      {modalType === 'deletePlaylist' && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Delete Playlist</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              Are you sure you want to delete "<span className="font-semibold text-slate-700">{modalData.name}</span>"? This will also delete all tracks. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all shadow-sm shadow-red-500/30">Delete Playlist</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}