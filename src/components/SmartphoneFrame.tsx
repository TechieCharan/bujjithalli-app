import React from 'react';
import { Calendar as CalendarIcon, Award } from 'lucide-react';
import type { DailyLog } from '../types';

interface SmartphoneFrameProps {
  children: React.ReactNode;
  dailyLogs?: DailyLog[];
}

export const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({ children, dailyLogs = [] }) => {

  // Compute remaining days to Target Exam (August 25, 2026)
  const examDate = new Date('2026-08-25T00:00:00');
  const today = new Date();
  examDate.setHours(0,0,0,0);
  const todayReset = new Date(today);
  todayReset.setHours(0,0,0,0);
  const diffTime = examDate.getTime() - todayReset.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Calendar parameters for May 2026
  // May 1, 2026 is a Friday (index 5: Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5)
  const startDayOffset = 5;
  const totalDays = 31;
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Check if a day has study records completed
  const isStudyDayCompleted = (day: number) => {
    const formattedDay = day.toString().padStart(2, '0');
    const dateStr = `2026-05-${formattedDay}`;
    return dailyLogs.some(log => log.date === dateStr && (log.hours > 0 || log.topicsCompleted > 0));
  };

  return (
    <div style={containerStyle}>
      {/* Cute Side Panel with instructions, countdown calendar, and hero */}
      <div className="desktop-side-panel" style={{ ...sidePanelStyle, display: 'flex', flexDirection: 'column', gap: '14px', width: '300px', height: 'fit-content', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '28px' }}>🌸</span>
          <div>
            <h2 style={{ fontFamily: 'var(--font-cute)', color: 'var(--text-primary)', fontSize: '18px', fontWeight: 700 }}>
              Bujjithalli Productivity
            </h2>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Study Focus Assistant</span>
          </div>
        </div>

        {/* Calendar Card displaying exam countdown */}
        <div className="glass-panel" style={{ padding: '14px', margin: 0, border: '1.5px solid var(--glass-border)', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}>
              <CalendarIcon size={12} style={{ color: 'var(--accent)' }} /> Exam Calendar
            </span>
            <span className="badge badge-high" style={{ fontSize: '9px', padding: '2px 6px' }}>
              Aug 25, 2026
            </span>
          </div>

          <div style={{ textAlign: 'center', margin: '4px 0 10px 0', background: 'var(--accent-light)', padding: '6px', borderRadius: '12px', border: '1px dashed var(--accent)' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-cute)' }}>
              ⏳ {diffDays > 0 ? `${diffDays} Days Left!` : 'Exam Day! 🏆'}
            </span>
          </div>

          {/* Mini Month Grid - May 2026 */}
          <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            May 2026
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
            {weekdays.map(wd => (
              <span key={wd} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.7 }}>
                {wd}
              </span>
            ))}
            
            {/* Empty offset spaces */}
            {Array.from({ length: startDayOffset }).map((_, idx) => (
              <span key={`empty-${idx}`} />
            ))}

            {/* Days of May */}
            {daysArray.map(day => {
              const completed = isStudyDayCompleted(day);
              const isToday = day === 21; // Today is May 21, 2026
              
              let cellStyle: React.CSSProperties = {
                fontSize: '10px',
                fontWeight: 700,
                padding: '4px 0',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'var(--transition-smooth)',
                position: 'relative'
              };

              if (completed) {
                cellStyle = {
                  ...cellStyle,
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  textDecoration: 'line-through',
                  border: '1.5px solid #86efac'
                };
              } else if (isToday) {
                cellStyle = {
                  ...cellStyle,
                  backgroundColor: 'var(--accent-light)',
                  color: 'var(--accent-color)',
                  border: '1.5px solid var(--accent)',
                  fontWeight: 800,
                  boxShadow: '0 0 8px var(--accent)'
                };
              } else {
                cellStyle = {
                  ...cellStyle,
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  opacity: 0.8
                };
              }

              return (
                <div key={day} style={cellStyle} title={completed ? 'Study logged! ✨' : isToday ? 'Today' : ''}>
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cute Illustration Image - Calendar section above the image */}
        <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', border: '1.5px solid var(--glass-border)', boxShadow: 'var(--panel-shadow)' }}>
          <img 
            src="/src/assets/hero.png" 
            alt="Bujjithalli Study Hero" 
            style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', padding: '10px', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={14} style={{ color: '#f5b041' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-cute)' }}>You can do it, Bujjithalli! 🏆</span>
          </div>
        </div>

        <div style={{ ...tipStyle, margin: 0, padding: '10px 12px' }}>
          <strong style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--text-primary)' }}>💡 Focus Tips:</strong>
          <ul style={{ paddingLeft: '12px', fontSize: '10px', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
            <li>Complete daily study log to highlight calendar days!</li>
            <li>Maintain Pomodoro streaks for study consistency.</li>
            <li>Track mock test scores to measure growth.</li>
          </ul>
        </div>
      </div>

      {/* Smartphone Simulator */}
      <div className="phone-simulator-frame">

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
