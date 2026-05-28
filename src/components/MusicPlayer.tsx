import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Trash2, Volume2, VolumeX, Repeat, UploadCloud, Music } from 'lucide-react';
import { musicStorage } from '../db/storage';
import { audioSynthesizer } from './AudioSynthesizer';

interface Track {
  id: string;
  name: string;
}

export const MusicPlayer: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.5);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentObjectUrlRef = useRef<string | null>(null);

  // Load tracks list from IndexedDB on mount
  const loadTracks = async () => {
    const list = await musicStorage.list();
    setTracks(list);
  };

  useEffect(() => {
    loadTracks();
    
    // Create audio element
    const audio = new Audio();
    audioRef.current = audio;

    // Track audio events
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const onEnded = () => {
      if (isLooping) {
        audio.currentTime = 0;
        audio.play().catch(e => console.warn('Audio play failed:', e));
      } else {
        handleNext();
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      
      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current);
      }
    };
  }, [isLooping, tracks]);

  // Sync volume state to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Load and play a specific track
  const playTrack = async (trackId: string) => {
    if (!audioRef.current) return;
    
    try {
      const trackData = await musicStorage.get(trackId);
      if (!trackData) {
        setErrorMsg('Could not find this track.');
        return;
      }

      // Stop current play and revoke previous URL
      audioRef.current.pause();
      setIsPlaying(false);

      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current);
      }

      // Create new Object URL
      const objectUrl = URL.createObjectURL(trackData.blob);
      currentObjectUrlRef.current = objectUrl;

      // Load and Play
      audioRef.current.src = objectUrl;
      audioRef.current.load();
      
      setCurrentTrackId(trackId);
      setIsPlaying(true);
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('Playback prevented or failed:', error);
          setIsPlaying(false);
        });
      }
    } catch (e) {
      console.error('Error playing track:', e);
      setErrorMsg('Failed to play audio track.');
    }
  };

  const handleTogglePlay = () => {
    audioSynthesizer.playChime('click');
    if (!audioRef.current) return;

    if (tracks.length === 0) {
      setErrorMsg('Please upload some study music first!');
      return;
    }

    if (!currentTrackId && tracks.length > 0) {
      playTrack(tracks[0].id);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(e => console.warn('Play failed:', e));
    }
  };

  const handleNext = () => {
    audioSynthesizer.playChime('click');
    if (tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrackId);
    let nextIndex = currentIndex + 1;
    if (nextIndex >= tracks.length) {
      nextIndex = 0; // Loop back to start
    }
    playTrack(tracks[nextIndex].id);
  };

  const handlePrev = () => {
    audioSynthesizer.playChime('click');
    if (tracks.length === 0) return;

    const currentIndex = tracks.findIndex(t => t.id === currentTrackId);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = tracks.length - 1; // Go to last
    }
    playTrack(tracks[prevIndex].id);
  };

  const handleDeleteTrack = async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    audioSynthesizer.playChime('click');
    
    if (currentTrackId === trackId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setCurrentTrackId(null);
      setIsPlaying(false);
      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current);
        currentObjectUrlRef.current = null;
      }
    }

    await musicStorage.delete(trackId);
    await loadTracks();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMsg(null);
    audioSynthesizer.playChime('complete');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Basic audio validation
      if (!file.type.startsWith('audio/')) {
        setErrorMsg('Invalid file type. Please upload audio files only.');
        continue;
      }

      // Limit audio file size to 15MB to prevent extreme DB bloat
      if (file.size > 15 * 1024 * 1024) {
        setErrorMsg('File too large (Max 15MB).');
        continue;
      }

      try {
        const key = `track_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        // Clean name (e.g. remove extension)
        const name = file.name.replace(/\.[^/.]+$/, "");
        await musicStorage.save(key, file, name);
      } catch (error) {
        console.error('Failed to save file:', error);
        setErrorMsg('Error saving file.');
      }
    }

    await loadTracks();
    setIsUploading(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = Number(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel music-player-container" style={{ padding: '16px', marginTop: '10px' }}>
      <h3 style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-cute)', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Music size={16} style={{ color: 'var(--accent)' }} /> 🎵 Cozy Study Beats
        </span>
        {tracks.length > 0 && isPlaying && (
          <div className="audio-spectrum" style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '12px' }}>
            <span className="spectrum-bar" />
            <span className="spectrum-bar" />
            <span className="spectrum-bar" />
            <span className="spectrum-bar" />
          </div>
        )}
      </h3>

      {/* Upload Section */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
        <label className="btn-cute btn-cute-secondary" style={{ flex: 1, padding: '8px 12px', fontSize: '11px', borderRadius: '12px', display: 'flex', gap: '6px', cursor: 'pointer', justifySelf: 'center', margin: 0, justifyContent: 'center' }}>
          <UploadCloud size={14} />
          {isUploading ? 'Adding beats...' : 'Upload Beats'}
          <input
            type="file"
            accept="audio/*"
            multiple
            onChange={handleUpload}
            style={{ display: 'none' }}
            disabled={isUploading}
          />
        </label>
      </div>

      {errorMsg && (
        <div style={{ color: '#e11d48', fontSize: '10px', fontWeight: 600, padding: '6px 10px', backgroundColor: '#ffe4e6', borderRadius: '8px', marginBottom: '10px', textAlign: 'center' }}>
          {errorMsg}
        </div>
      )}

      {/* Tracks List */}
      {tracks.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '16px 0', border: '1px dashed var(--glass-border)', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <Music size={24} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', padding: '0 10px' }}>
            No study beats uploaded yet. Drop some relaxing MP3s here!
          </span>
        </div>
      ) : (
        <div className="music-tracks-list" style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', paddingRight: '4px' }}>
          {tracks.map((track) => {
            const isCurrent = track.id === currentTrackId;
            return (
              <div
                key={track.id}
                onClick={() => playTrack(track.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  backgroundColor: isCurrent ? 'var(--accent-light)' : 'rgba(255,255,255,0.2)',
                  border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--glass-border)'}`,
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '80%', overflow: 'hidden' }}>
                  <Music size={12} style={{ color: isCurrent ? 'var(--accent)' : 'var(--text-secondary)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: isCurrent ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {track.name}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeleteTrack(e, track.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px'
                  }}
                >
                  <Trash2 size={12} className="delete-icon-hover" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Player Seeker & Time Controls */}
      {currentTrackId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 0 0 0', borderTop: '1.5px solid var(--glass-border)' }}>
          {/* Seeker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600, width: '25px', textAlign: 'right' }}>
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="player-range"
              style={{ flex: 1, height: '4px', outline: 'none', borderRadius: '4px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600, width: '25px' }}>
              {formatTime(duration)}
            </span>
          </div>

          {/* Player controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            {/* Loop Toggle */}
            <button
              onClick={() => { audioSynthesizer.playChime('click'); setIsLooping(!isLooping); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: isLooping ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title={isLooping ? "Loop On" : "Loop Off"}
            >
              <Repeat size={14} style={{ strokeWidth: isLooping ? 3 : 2 }} />
            </button>

            {/* Transport controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button
                onClick={handlePrev}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
              >
                <SkipBack size={16} fill="var(--text-primary)" stroke="none" />
              </button>
              
              <button
                onClick={handleTogglePlay}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.1)'
                }}
              >
                {isPlaying ? <Pause size={14} fill="white" stroke="none" /> : <Play size={14} fill="white" stroke="none" style={{ marginLeft: '2px' }} />}
              </button>

              <button
                onClick={handleNext}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
              >
                <SkipForward size={16} fill="var(--text-primary)" stroke="none" />
              </button>
            </div>

            {/* Volume controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setIsMuted(!isMuted)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
              >
                {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="player-range-vol"
                style={{ width: '40px', height: '4px', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Styled custom spectrum and slider elements via inline styles & CSS */}
      <style>{`
        .delete-icon-hover:hover {
          color: #ef4444;
          transform: scale(1.15);
          transition: all 0.2s ease;
        }
        .audio-spectrum .spectrum-bar {
          display: inline-block;
          width: 3px;
          background-color: var(--accent);
          border-radius: 99px;
          animation: wave-bar 1.2s ease-in-out infinite alternate;
        }
        .audio-spectrum .spectrum-bar:nth-child(1) { height: 4px; animation-delay: 0.1s; }
        .audio-spectrum .spectrum-bar:nth-child(2) { height: 10px; animation-delay: 0.3s; }
        .audio-spectrum .spectrum-bar:nth-child(3) { height: 6px; animation-delay: 0.5s; }
        .audio-spectrum .spectrum-bar:nth-child(4) { height: 8px; animation-delay: 0.2s; }
        
        @keyframes wave-bar {
          0% { height: 2px; }
          100% { height: 12px; }
        }

        .player-range, .player-range-vol {
          -webkit-appearance: none;
          appearance: none;
          background: var(--glass-border);
          outline: none;
          border-radius: 4px;
        }
        .player-range::-webkit-slider-thumb, .player-range-vol::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .player-range::-webkit-slider-thumb:hover, .player-range-vol::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 5px var(--accent);
        }
      `}</style>
    </div>
  );
};
export default MusicPlayer;
