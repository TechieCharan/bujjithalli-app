import React, { useEffect, useState } from 'react';
import { Calendar, Flame, Heart, ChevronRight, Award } from 'lucide-react';
import type { SyllabusSubject, TodoItem } from '../types';

interface DashboardProps {
  userName: string;
  syllabus: SyllabusSubject[];
  todos: TodoItem[];
  streak: number;
  onNavigate: (tab: 'syllabus' | 'timer' | 'todo' | 'bucket') => void;
}

const BUJJI_QUOTES = [
  "You've got this, Bujjithalli! 💖",
  "Every small step brings you closer to your dream rank! 👑",
  "Take a deep breath, Bujjithalli, you are doing amazing! 🌸",
  "Your dedication is inspiring. Focus and shine! ✨",
  "Don't stress, Bujjithalli, just do your best! ☕",
  "SSC CGL is just a exam, but you are a superstar! 🌟",
  "Work hard in silence, let your CGL score make the noise! 📚",
  "You are capable of doing wonderful things! 💕"
];

export const Dashboard: React.FC<DashboardProps> = ({
  userName,
  syllabus,
  todos,
  streak,
  onNavigate
}) => {
  const [quote, setQuote] = useState('');
  const [greeting, setGreeting] = useState('Hello');

  useEffect(() => {
    // Select daily quote
    const randomQuote = BUJJI_QUOTES[Math.floor(Math.random() * BUJJI_QUOTES.length)];
    setQuote(randomQuote);

    // Calculate time-based greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning ☀️');
    else if (hour < 17) setGreeting('Good Afternoon ☁️');
    else setGreeting('Good Evening 🌙');
  }, [userName]);

  // Compute Syllabus Progress
  let totalTopics = 0;
  let completedTopics = 0;
  syllabus.forEach(subject => {
    subject.topics.forEach(topic => {
      totalTopics++;
      if (topic.status === 'completed') {
        completedTopics++;
      }
    });
  });
  const syllabusPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // SVG Circular Gauge Calculations
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (syllabusPercent / 100) * circumference;

  // Filter Today's Tasks (max 3, sorted by priority)
  const pendingTodos = todos.filter(t => !t.completed);
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedTodos = [...pendingTodos].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  const dashboardTodos = sortedTodos.slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Welcome & Quote Banner */}
      <div className="glass-panel" style={{ padding: '22px', textAlign: 'center', background: 'linear-gradient(135deg, var(--glass-bg), var(--accent-light))' }}>
        <span className="badge" style={{ backgroundColor: 'var(--accent)', color: 'white', marginBottom: '8px' }}>
          Welcome back! ✨
        </span>
        <h1 className="cute-title" style={{ fontSize: '22px', margin: '4px 0' }}>
          {greeting}, {userName}!
        </h1>
        <p className="cute-subtitle" style={{ fontSize: '13px', margin: '8px 0 0 0', fontStyle: 'italic', lineHeight: '1.4' }}>
          "{quote}"
        </p>
      </div>

      {/* Grid: Progress Ring & Daily Streak */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Progress Ring Card */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', fontFamily: 'var(--font-cute)' }}>
            CGL SYLLABUS
          </span>
          <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
              {/* Underlay Track */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                fill="transparent"
                stroke="var(--glass-border)"
                strokeWidth="10"
              />
              {/* Progress Bar */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                fill="transparent"
                stroke="var(--accent)"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-cute)' }}>
                {syllabusPercent}%
              </span>
              <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {completedTopics}/{totalTopics} topics
              </span>
            </div>
          </div>
          <button 
            className="btn-cute btn-cute-secondary" 
            style={{ width: '100%', padding: '6px 10px', fontSize: '11px', marginTop: '12px', borderRadius: '12px' }}
            onClick={() => onNavigate('syllabus')}
          >
            Track <ChevronRight size={12} />
          </button>
        </div>

        {/* Streak & Focus Card */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px', fontFamily: 'var(--font-cute)' }}>
            STUDY STREAK
          </span>
          
          <div style={{ position: 'relative', margin: '6px 0 10px 0', transform: streak > 0 ? 'scale(1.1)' : 'none', transition: 'transform 0.5s' }}>
            <div style={{ 
              width: '70px', 
              height: '70px', 
              borderRadius: '50%', 
              background: 'var(--accent-light)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '2px dashed var(--accent)',
              color: 'var(--accent-hover)'
            }}>
              {streak > 0 ? <Flame size={36} fill="var(--accent)" stroke="none" /> : <Award size={36} />}
            </div>
            {streak > 0 && (
              <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#e11d48', padding: '2px 6px', borderRadius: '10px', color: 'white', fontSize: '9px', fontWeight: 'bold' }}>
                HOT! 🔥
              </div>
            )}
          </div>
          
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-cute)' }}>
            {streak} Study {streak === 1 ? 'Day' : 'Days'}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.2' }}>
            {streak > 0 ? 'Doing wonderful!' : 'Start focusing today!'}
          </span>

          <button 
            className="btn-cute" 
            style={{ width: '100%', padding: '6px 10px', fontSize: '11px', marginTop: '12px', borderRadius: '12px' }}
            onClick={() => onNavigate('timer')}
          >
            Start Timer <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Focus Area: Priority To-Dos */}
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-cute)', color: 'var(--text-primary)' }}>
            🎯 Critical Tasks Today
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--accent-hover)', fontWeight: 700, cursor: 'pointer' }} onClick={() => onNavigate('todo')}>
            View all
          </span>
        </div>

        {dashboardTodos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-secondary)' }}>
            <Heart size={24} style={{ color: 'var(--accent)', marginBottom: '8px', opacity: 0.6 }} />
            <p style={{ fontSize: '12px' }}>No pending urgent tasks, Bujjithalli!</p>
            <p style={{ fontSize: '10px', opacity: 0.8 }}>Enjoy your free time or add a new task.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dashboardTodos.map(todo => (
              <div 
                key={todo.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '10px 14px', 
                  borderRadius: '12px', 
                  background: 'var(--bg-primary)',
                  border: '1.5px solid var(--glass-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '14px' }}>
                    {todo.category === 'study' ? '📚' : todo.category === 'personal' ? '🌸' : todo.category === 'health' ? '🏃‍♀️' : '⭐'}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {todo.text}
                  </span>
                </div>
                <span className={`badge badge-${todo.priority}`} style={{ textTransform: 'capitalize' }}>
                  {todo.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Motivational Bottom Quote */}
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--accent-light)', border: '1px dashed var(--accent)' }}>
        <Calendar size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 500, lineHeight: '1.4' }}>
          <strong>CGL Target</strong>: Master 1 topic today, revise for 10 minutes on your Pomodoro breaks, and write down 1 big dream! 💕
        </span>
      </div>
    </div>
  );
};
export default Dashboard;
