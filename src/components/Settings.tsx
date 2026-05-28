import React, { useState } from 'react';
import { User, Palette, Moon, Sun, Download, Upload, Heart, ShieldAlert, Volume2, VolumeX } from 'lucide-react';
import type { AppTheme, UserProfile } from '../types';
import { audioSynthesizer } from './AudioSynthesizer';
import { photoStorage } from '../db/storage';

interface SettingsProps {
  profile: UserProfile;
  activeTheme: AppTheme;
  isDarkMode: boolean;
  onUpdateProfileName: (name: string) => void;
  onSelectTheme: (theme: AppTheme) => void;
  onToggleDarkMode: () => void;
  onResetAllData: () => void;
  onImportAllData: (jsonData: string) => void;
  exportDataString: string;
}

export const Settings: React.FC<SettingsProps> = ({
  profile,
  activeTheme,
  isDarkMode,
  onUpdateProfileName,
  onSelectTheme,
  onToggleDarkMode,
  onResetAllData,
  onImportAllData,
  exportDataString
}) => {
  const [nameInput, setNameInput] = useState<string>(profile.name);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => audioSynthesizer.getMuted());

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioSynthesizer.setMuted(newMuted);
    if (!newMuted) {
      audioSynthesizer.playChime('click');
    }
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    audioSynthesizer.playChime('complete');
    onUpdateProfileName(nameInput.trim());
    alert("Profile name updated successfully, Bujjithalli! 🌸");
  };

  const handleThemeChange = (theme: AppTheme) => {
    audioSynthesizer.playChime('complete');
    onSelectTheme(theme);
  };

  const handleDarkModeToggle = () => {
    audioSynthesizer.playChime('click');
    onToggleDarkMode();
  };

  // Export JSON file
  const handleExport = () => {
    audioSynthesizer.playChime('complete');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportDataString);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bujjithalli_productivity_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Basic validation
        JSON.parse(text);
        audioSynthesizer.playChime('complete');
        onImportAllData(text);
        alert("Backup imported successfully! The page will refresh to apply your data. 🌸");
      } catch (err) {
        console.error(err);
        alert("Error: Invalid JSON backup file.");
      }
    };
    reader.readAsText(file);
  };

  const handleFullReset = async () => {
    audioSynthesizer.playChime('click');
    await photoStorage.clear();
    onResetAllData();
    alert("All offline databases reset to factory defaults! 🌸");
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Profile settings card */}
      <form onSubmit={handleSaveName} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-cute)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={16} style={{ color: 'var(--accent)' }} /> 🌸 Profile Settings
        </h3>

        <div>
          <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Your Nickname (defaults to Bujjithalli)
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="input-cute"
              placeholder="Enter name..."
              required
            />
            <button type="submit" className="btn-cute" style={{ padding: '10px 14px', fontSize: '11px', borderRadius: '12px' }}>
              Save
            </button>
          </div>
        </div>
      </form>

      {/* Theme customization card */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-cute)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Palette size={16} style={{ color: 'var(--accent)' }} /> 🎨 Pastel Color Themes
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Themes list */}
          {[
            { id: 'cozy-room', name: 'Cozy Room 🌸', color1: '#ff9ebb', color2: '#fff0f3' },
            { id: 'night-sky', name: 'Dreamy Night Sky 🌙', color1: '#ac94f4', color2: '#f0f0ff' },
            { id: 'nature-rain', name: 'Nature Rain 🍃', color1: '#6cdba2', color2: '#f0fcf4' },
            { id: 'study-desk', name: 'Pastel Study Desk 📝', color1: '#f5b041', color2: '#fffdf5' },
            { id: 'ocean-breeze', name: 'Ocean Breeze 🌊', color1: '#6ebdec', color2: '#f0f9ff' }
          ].map(theme => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id as AppTheme)}
              className="glass-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                margin: 0,
                cursor: 'pointer',
                border: activeTheme === theme.id ? '2px solid var(--accent)' : '1.5px solid var(--glass-border)',
                backgroundColor: activeTheme === theme.id ? 'var(--accent-light)' : 'var(--glass-bg)',
                transform: activeTheme === theme.id ? 'scale(1.01)' : 'none'
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-cute)' }}>
                {theme.name}
              </span>
              
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: theme.color1, border: '1px solid white' }} />
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: theme.color2, border: '1px solid white' }} />
              </div>
            </button>
          ))}
        </div>

        {/* Dark Mode/Light Mode toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '12px', marginTop: '4px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-cute)' }}>
              Cozy Dark Mode
            </span>
            <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Switch color variable presets
            </span>
          </div>

          <button
            onClick={handleDarkModeToggle}
            className="btn-cute btn-cute-secondary"
            style={{
              padding: '8px 12px', borderRadius: '12px', fontSize: '11px', display: 'flex', gap: '6px', alignItems: 'center'
            }}
          >
            {isDarkMode ? <Moon size={12} /> : <Sun size={12} />}
            {isDarkMode ? 'Night Desk' : 'Morning Desk'}
          </button>
        </div>
      </div>

      {/* Sound Settings Card */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-cute)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Volume2 size={16} style={{ color: 'var(--accent)' }} /> 🔊 Sound Preferences
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-cute)' }}>
              Application Audio
            </span>
            <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Mute study soundscapes and interface chimes
            </span>
          </div>

          <button
            onClick={handleToggleMute}
            className="btn-cute btn-cute-secondary"
            style={{
              padding: '8px 12px', borderRadius: '12px', fontSize: '11px', display: 'flex', gap: '6px', alignItems: 'center',
              backgroundColor: isMuted ? 'var(--accent-light)' : 'transparent',
              borderColor: isMuted ? 'var(--accent)' : 'var(--glass-border)',
              color: isMuted ? 'var(--accent)' : 'var(--text-primary)'
            }}
          >
            {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            {isMuted ? 'Muted' : 'Unmuted'}
          </button>
        </div>
      </div>

      {/* Local Cloud backup sync card */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-cute)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Download size={16} style={{ color: 'var(--accent)' }} /> ☁️ Data Backup & Sync
        </h3>
        
        <p style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          This app operates 100% offline. Save your progress regularly by downloading an encrypted study JSON backup.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button onClick={handleExport} className="btn-cute" style={{ padding: '8px', fontSize: '11px', borderRadius: '12px', display: 'flex', gap: '4px' }}>
            <Download size={12} /> Export Data
          </button>
          
          <label className="btn-cute btn-cute-secondary" style={{ padding: '8px', fontSize: '11px', borderRadius: '12px', display: 'flex', gap: '4px', cursor: 'pointer', justifyContent: 'center' }}>
            <Upload size={12} /> Import Data
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportFile} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(254, 242, 242, 0.3)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-cute)', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldAlert size={16} /> Danger Zone
        </h3>

        {!showResetConfirm ? (
          <button 
            onClick={() => { audioSynthesizer.playChime('click'); setShowResetConfirm(true); }} 
            className="btn-cute btn-cute-secondary" 
            style={{ width: '100%', padding: '8px', fontSize: '11px', color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.2)' }}
          >
            Reset All Application Data
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.2s' }}>
            <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 600 }}>
              Are you absolutely sure? This will delete all syllabus notes, todos, study streaks, and bucket list photos!
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setShowResetConfirm(false)} 
                className="btn-cute btn-cute-secondary" 
                style={{ flex: 1, padding: '6px', fontSize: '10px' }}
              >
                No, Keep Data
              </button>
              <button 
                onClick={handleFullReset} 
                className="btn-cute" 
                style={{ flex: 1, padding: '6px', fontSize: '10px', backgroundColor: '#ef4444' }}
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer Branding */}
      <div style={{ textAlign: 'center', padding: '14px 0', color: 'var(--text-secondary)' }}>
        <Heart size={16} fill="var(--accent)" stroke="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
        <span style={{ fontSize: '11px', fontWeight: 500 }}>Bujjithalli Productivity v1.0.0</span>
      </div>
    </div>
  );
};
export default Settings;
