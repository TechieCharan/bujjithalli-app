import React, { useEffect, useState } from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface SmartphoneFrameProps {
  children: React.ReactNode;
}

export const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({ children }) => {
  const [time, setTime] = useState<string>('09:41');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={containerStyle}>
      {/* Cute Side Panel with instructions and greeting */}
      <div className="desktop-side-panel" style={sidePanelStyle}>
        <div style={{ fontSize: '32px', marginBottom: '10px' }}>🌸</div>
        <h2 style={{ fontFamily: 'var(--font-cute)', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Bujjithalli Productivity
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '15px' }}>
          Welcome to your personal productivity space! Track your SSC CGL syllabus, stay focused with relaxing ambient sound timers, map out daily tasks, and capture your beautiful dreams.
        </p>
        <div style={tipStyle}>
          <strong style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>💡 Quick Tips:</strong>
          <ul style={{ paddingLeft: '15px', fontSize: '11px', lineHeight: '1.4' }}>
            <li>Change theme & toggle dark mode in Settings tab!</li>
            <li>Timer sounds are synthesized offline in real-time.</li>
            <li>Click Syllabus items to add study notes and targets.</li>
            <li>Upload real photos to your dream Bucket List!</li>
          </ul>
        </div>
        <span style={{ fontSize: '11px', opacity: 0.6, marginTop: '20px', display: 'block' }}>
          Crafted with love 💖
        </span>
      </div>

      {/* Smartphone Simulator */}
      <div className="phone-simulator-frame">
        {/* Virtual Top Bar / Status Bar */}
        <div className="app-status-bar">
          <span>{time}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Signal size={12} />
            <Wifi size={12} />
            <Battery size={14} style={{ transform: 'rotate(90deg)', marginLeft: '2px' }} />
          </div>
        </div>

        {/* Embedded Screen App */}
        <div className="phone-screen">
          {children}
        </div>
      </div>
      
      {/* Add responsive desktop panel styling */}
      <style>{`
        .desktop-side-panel {
          display: flex;
        }
        @media (max-width: 900px) {
          .desktop-side-panel {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

// Styling Object
const containerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '50px',
  width: '100vw',
  minHeight: '100vh',
  padding: '20px',
  boxSizing: 'border-box'
};

const sidePanelStyle: React.CSSProperties = {
  flexDirection: 'column',
  width: '280px',
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: 'var(--panel-shadow)',
  color: 'var(--text-primary)',
  transition: 'var(--transition-smooth)'
};

const tipStyle: React.CSSProperties = {
  background: 'var(--accent-light)',
  borderRadius: '16px',
  padding: '12px 14px',
  color: 'var(--text-primary)',
  border: '1px solid rgba(255,255,255,0.4)',
  marginTop: '10px'
};
export default SmartphoneFrame;
