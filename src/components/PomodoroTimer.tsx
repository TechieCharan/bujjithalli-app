import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Flame, Clock, Settings2 } from 'lucide-react';
import { audioSynthesizer } from './AudioSynthesizer';
import { MusicPlayer } from './MusicPlayer';
import type { AppTheme } from '../types';

interface PomodoroTimerProps {
  activeTheme: AppTheme;
  streak: number;
  onIncrementStreak: () => void;
  onLogSession: (duration: number, type: 'focus' | 'short_break' | 'long_break') => void;
}

const MOTIVATIONAL_QUOTES = [
  "You've got this",
  "Focus on the process, not the results",
  "Take it one breath at a time. ",
  "Your future self will thank you for this focus! ",
  "Deep breaths. Inhale confidence, exhale doubt! ",
  "Doing great! Enjoy this calm focus session."
];

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  activeTheme,
  streak,
  onIncrementStreak,
  onLogSession
}) => {
  // Timer durations in seconds
  const [focusDuration, setFocusDuration] = useState<number>(25 * 60);
  const [shortDuration, setShortDuration] = useState<number>(5 * 60);
  const [longDuration, setLongDuration] = useState<number>(15 * 60);

  const [activeMode, setActiveMode] = useState<'focus' | 'short_break' | 'long_break'>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Audio Synthesizer State
  const [activeSound, setActiveSound] = useState<'rain' | 'waves' | 'wind' | 'off'>('off');
  const [isMutedGlobal, setIsMutedGlobal] = useState<boolean>(() => audioSynthesizer.getMuted());

  const toggleMuteGlobal = () => {
    const newMuted = !isMutedGlobal;
    setIsMutedGlobal(newMuted);
    audioSynthesizer.setMuted(newMuted);
    if (!newMuted) {
      audioSynthesizer.playChime('click');
    }
  };

  // Custom Settings Open
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [customFocus, setCustomFocus] = useState<number>(25);
  const [customShort, setCustomShort] = useState<number>(5);
  const [customLong, setCustomLong] = useState<number>(15);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync timeLeft when duration or mode changes
  useEffect(() => {
    resetTimer();
  }, [focusDuration, shortDuration, longDuration, activeMode]);

  // Handle countdown
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, activeMode]);

  const handleTimerComplete = () => {
    setIsRunning(false);

    // Play chime sound
    if (activeMode === 'focus') {
      audioSynthesizer.playChime('complete');
      onIncrementStreak();
      onLogSession(Math.round(focusDuration / 60), 'focus');
      alert("Wonderful job! You completed your study session! Take a sweet break now.");
    } else {
      audioSynthesizer.playChime('break');
      onLogSession(Math.round(activeMode === 'short_break' ? shortDuration / 60 : longDuration / 60), activeMode);
      alert("Break is over! Ready to focus again?");
    }

    resetTimer();
  };

  const toggleTimer = () => {
    audioSynthesizer.playChime('click');
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (activeMode === 'focus') setTimeLeft(focusDuration);
    else if (activeMode === 'short_break') setTimeLeft(shortDuration);
    else setTimeLeft(longDuration);
  };

  // Quick Sound synthesizer toggler
  const handleToggleSound = (type: 'rain' | 'waves' | 'wind') => {
    audioSynthesizer.playChime('click');
    if (activeSound === type) {
      audioSynthesizer.stop();
      setActiveSound('off');
    } else {
      audioSynthesizer.play(type);
      setActiveSound(type);
    }
  };

  // Format Time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate Circular Track Progress
  const getCurrentTotalSeconds = () => {
    if (activeMode === 'focus') return focusDuration;
    if (activeMode === 'short_break') return shortDuration;
    return longDuration;
  };
  const totalSecs = getCurrentTotalSeconds();
  const progressPercent = totalSecs > 0 ? ((totalSecs - timeLeft) / totalSecs) * 100 : 0;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Apply Custom Durations
  const handleApplyConfig = () => {
    audioSynthesizer.playChime('complete');
    setFocusDuration(customFocus * 60);
    setShortDuration(customShort * 60);
    setLongDuration(customLong * 60);
    setShowConfig(false);
  };

  // Render Theme floating backgrounds
  const renderFloatingOverlay = () => {
    if (activeTheme === 'cozy-room') {
      return (
        <div className="aesthetic-animation-overlay">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="blossom-petal"
              style={{
                left: `${Math.random() * 80}%`,
                top: `${-20 - Math.random() * 40}px`,
                animationDelay: `${i * 2}s`,
                width: `${10 + Math.random() * 12}px`,
                height: `${10 + Math.random() * 12}px`
              }}
            />
          ))}
        </div>
      );
    }
    if (activeTheme === 'nature-rain') {
      return (
        <div className="aesthetic-animation-overlay">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="rain-drop"
              style={{
                left: `${Math.random() * 95}%`,
                top: `-50px`,
                animationDelay: `${Math.random() * 2.5}s`,
                animationDuration: `${1.2 + Math.random() * 0.8}s`
              }}
            />
          ))}
        </div>
      );
    }
    if (activeTheme === 'night-sky') {
      return (
        <div className="aesthetic-animation-overlay">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="star-twinkle"
              style={{
                left: `${Math.random() * 95}%`,
                top: `${Math.random() * 80}%`,
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
      {/* Drifting overlays inside phone viewport */}
      {renderFloatingOverlay()}

      {/* Mode Switches */}
      <div style={{ display: 'flex', background: 'var(--glass-bg)', padding: '6px', borderRadius: '16px', border: '1.5px solid var(--glass-border)', gap: '4px' }}>
        <button
          onClick={() => { audioSynthesizer.playChime('click'); setActiveMode('focus'); }}
          style={{
            flex: 1, padding: '10px 6px', fontSize: '11px', fontWeight: 700, borderRadius: '12px', border: 'none',
            backgroundColor: activeMode === 'focus' ? 'var(--accent)' : 'transparent',
            color: activeMode === 'focus' ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer', transition: 'var(--transition-smooth)', fontFamily: 'var(--font-cute)'
          }}
        >
          📚 Focus
        </button>
        <button
          onClick={() => { audioSynthesizer.playChime('click'); setActiveMode('short_break'); }}
          style={{
            flex: 1, padding: '10px 6px', fontSize: '11px', fontWeight: 700, borderRadius: '12px', border: 'none',
            backgroundColor: activeMode === 'short_break' ? 'var(--accent)' : 'transparent',
            color: activeMode === 'short_break' ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer', transition: 'var(--transition-smooth)', fontFamily: 'var(--font-cute)'
          }}
        >
          ☕ Short Break
        </button>
        <button
          onClick={() => { audioSynthesizer.playChime('click'); setActiveMode('long_break'); }}
          style={{
            flex: 1, padding: '10px 6px', fontSize: '11px', fontWeight: 700, borderRadius: '12px', border: 'none',
            backgroundColor: activeMode === 'long_break' ? 'var(--accent)' : 'transparent',
            color: activeMode === 'long_break' ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer', transition: 'var(--transition-smooth)', fontFamily: 'var(--font-cute)'
          }}
        >
          🍃 Long Break
        </button>
      </div>

      {/* Main Focus Ring Countdown Gauge */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', position: 'relative' }}>
        {/* Custom duration configure cog */}
        <button
          className="btn-circle"
          onClick={() => { audioSynthesizer.playChime('click'); setShowConfig(true); }}
          style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px' }}
        >
          <Settings2 size={14} />
        </button>

        {/* Large SVG Ring Progress */}
        <div style={{ position: 'relative', width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px 0' }}>
          <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="transparent"
              stroke="var(--glass-border)"
              strokeWidth="12"
            />
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="transparent"
              stroke="var(--accent)"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.3s linear' }}
            />
          </svg>
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '38px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-cute)', letterSpacing: '-1px' }}>
              {formatTime(timeLeft)}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
              {activeMode === 'focus' ? 'Study hard!' : 'Rest time!'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '10px' }}>
          <button
            className="btn-circle"
            style={{ width: '48px', height: '48px', color: 'var(--text-secondary)' }}
            onClick={() => { audioSynthesizer.playChime('click'); resetTimer(); }}
          >
            <RotateCcw size={20} />
          </button>

          <button
            className="btn-cute"
            style={{ padding: '14px 28px', fontSize: '16px', borderRadius: '30px', width: '130px', boxShadow: '0 6px 20px rgba(0,0,0,0.1)' }}
            onClick={toggleTimer}
          >
            {isRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            {isRunning ? 'Pause' : 'Focus'}
          </button>

          <div
            style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-hover)' }}
          >
            <Flame size={20} fill="var(--accent)" stroke="none" />
          </div>
        </div>

        {/* Motivational quote display */}
        <p style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: '22px', textAlign: 'center', maxWidth: '80%', lineHeight: '1.4' }}>
          "{MOTIVATIONAL_QUOTES[streak % MOTIVATIONAL_QUOTES.length]}"
        </p>
      </div>

      {/* Web Audio Ambient Player Panel */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-cute)', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isMutedGlobal ? <VolumeX size={16} style={{ color: '#ef4444' }} /> : <Volume2 size={16} style={{ color: 'var(--accent)' }} />} 🎧 Study Soundscapes (Offline Synth)
          </h3>
          <button
            onClick={toggleMuteGlobal}
            className="btn-circle"
            title={isMutedGlobal ? "Unmute All" : "Mute All"}
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isMutedGlobal ? 'rgba(239, 68, 68, 0.15)' : 'var(--glass-bg)',
              borderColor: isMutedGlobal ? '#ef4444' : 'var(--glass-border)',
              color: isMutedGlobal ? '#ef4444' : 'var(--text-primary)'
            }}
          >
            {isMutedGlobal ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleToggleSound('rain')}
            className="btn-cute"
            style={{
              flex: 1, padding: '8px 4px', fontSize: '10px', borderRadius: '12px',
              backgroundColor: activeSound === 'rain' ? '#10b981' : 'var(--glass-bg)',
              color: activeSound === 'rain' ? 'white' : 'var(--text-primary)',
              border: '1.5px solid var(--glass-border)'
            }}
          >
            🌧️ Rain
          </button>
          <button
            onClick={() => handleToggleSound('waves')}
            className="btn-cute"
            style={{
              flex: 1, padding: '8px 4px', fontSize: '10px', borderRadius: '12px',
              backgroundColor: activeSound === 'waves' ? '#10b981' : 'var(--glass-bg)',
              color: activeSound === 'waves' ? 'white' : 'var(--text-primary)',
              border: '1.5px solid var(--glass-border)'
            }}
          >
            🌊 Ocean
          </button>
          <button
            onClick={() => handleToggleSound('wind')}
            className="btn-cute"
            style={{
              flex: 1, padding: '8px 4px', fontSize: '10px', borderRadius: '12px',
              backgroundColor: activeSound === 'wind' ? '#10b981' : 'var(--glass-bg)',
              color: activeSound === 'wind' ? 'white' : 'var(--text-primary)',
              border: '1.5px solid var(--glass-border)'
            }}
          >
            🍃 Wind
          </button>
          {activeSound !== 'off' && (
            <button
              onClick={() => { audioSynthesizer.playChime('click'); audioSynthesizer.stop(); setActiveSound('off'); }}
              className="btn-circle"
              style={{ width: '32px', height: '32px', backgroundColor: '#ef4444', color: 'white', borderColor: 'transparent' }}
            >
              <VolumeX size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Cozy Custom Music Uploader & Player */}
      <MusicPlayer />

      {/* Duration Config Modal */}
      {showConfig && (
        <div className="modal-backdrop" onClick={() => setShowConfig(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-cute)' }}>
                  Timer Configuration
                </h3>
              </div>
              <button className="btn-circle" style={{ width: '32px', height: '32px' }} onClick={() => setShowConfig(false)}>
                x
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Study Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customFocus}
                  onChange={(e) => setCustomFocus(Number(e.target.value))}
                  className="input-cute"
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Short Break (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="45"
                  value={customShort}
                  onChange={(e) => setCustomShort(Number(e.target.value))}
                  className="input-cute"
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Long Break (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={customLong}
                  onChange={(e) => setCustomLong(Number(e.target.value))}
                  className="input-cute"
                />
              </div>

              <button className="btn-cute" style={{ marginTop: '8px', padding: '12px' }} onClick={handleApplyConfig}>
                Apply New Presets 🌸
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PomodoroTimer;
