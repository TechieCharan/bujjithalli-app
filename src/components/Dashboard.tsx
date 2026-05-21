import React, { useEffect, useState } from 'react';
import { Calendar, Flame, Heart, ChevronRight, Award, TrendingUp, Activity, Plus } from 'lucide-react';
import type { SyllabusSubject, TodoItem, DailyLog, MockTest } from '../types';
import { audioSynthesizer } from './AudioSynthesizer';

interface DashboardProps {
  userName: string;
  syllabus: SyllabusSubject[];
  todos: TodoItem[];
  streak: number;
  dailyLogs: DailyLog[];
  mockTests: MockTest[];
  onLogDailyStudy: (hours: number, topicsCompleted: number) => void;
  onAddMockTest: (score: number, notes?: string) => void;
  onNavigate: (tab: 'syllabus' | 'timer' | 'todo' | 'bucket') => void;
}

const BUJJI_QUOTES = [
  "You've got this, Bujjithalli! 💖",
  "Every small step brings you closer to your dream rank! 👑",
  "Take a deep breath, Bujjithalli, you are doing amazing! 🌸",
  "Your dedication is inspiring. Focus and shine! ✨",
  "Don't stress, Bujjithalli, just do your best! ☕",
  "SSC CGL is just an exam, but you are a superstar! 🌟",
  "Work hard in silence, let your CGL score make the noise! 📚",
  "You are capable of doing wonderful things! 💕"
];

export const Dashboard: React.FC<DashboardProps> = ({
  userName,
  syllabus,
  todos,
  streak,
  dailyLogs = [],
  mockTests = [],
  onLogDailyStudy,
  onAddMockTest,
  onNavigate
}) => {
  const [quote, setQuote] = useState('');
  const [greeting, setGreeting] = useState('Hello');
  const [activeSubTab, setActiveSubTab] = useState<'study' | 'mock'>('study');

  // Input forms state
  const [studyHours, setStudyHours] = useState<string>('4');
  const [studyTopics, setStudyTopics] = useState<string>('1');
  const [mockScore, setMockScore] = useState<string>('130');
  const [mockNotes, setMockNotes] = useState<string>('');

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

  // --- STATS COMPUTATION ---
  // Study logs stats
  const totalStudyHours = dailyLogs.reduce((acc, log) => acc + log.hours, 0);
  const avgStudyHours = dailyLogs.length > 0 ? (totalStudyHours / dailyLogs.length).toFixed(1) : '0';

  // Mock test stats
  const totalMockTests = mockTests.length;
  const mockScoresArray = mockTests.map(m => m.score);
  const highestMockScore = mockScoresArray.length > 0 ? Math.max(...mockScoresArray) : 0;
  const averageMockScore = mockScoresArray.length > 0 ? Math.round(mockScoresArray.reduce((acc, s) => acc + s, 0) / totalMockTests) : 0;

  // Handle study log submission
  const handleStudySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hoursNum = parseFloat(studyHours);
    const topicsNum = parseInt(studyTopics, 10);
    if (isNaN(hoursNum) || hoursNum <= 0 || isNaN(topicsNum) || topicsNum < 0) return;

    audioSynthesizer.playChime('complete');
    onLogDailyStudy(hoursNum, topicsNum);
    alert(`Logged study details for today! Keep up the magic, Bujjithalli! 🌸`);
    
    // Reset inputs
    setStudyHours('4');
    setStudyTopics('1');
  };

  // Handle mock test submission
  const handleMockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const scoreNum = parseInt(mockScore, 10);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 200) {
      alert("Please enter a valid mock test score out of 200!");
      return;
    }

    audioSynthesizer.playChime('complete');
    onAddMockTest(scoreNum, mockNotes.trim());
    alert(`Mock test logged! Your score is ${scoreNum}/200. Proud of you, Bujjithalli! 🏆`);
    
    // Reset inputs
    setMockScore('130');
    setMockNotes('');
  };

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
              <circle
                cx="65"
                cy="65"
                r={radius}
                fill="transparent"
                stroke="var(--glass-border)"
                strokeWidth="10"
              />
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

      {/* --- STUDY LOGS & MOCK TEST SEGMENTED PANEL --- */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Navigation Switchers */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '14px', padding: '4px' }}>
          <button
            onClick={() => { audioSynthesizer.playChime('click'); setActiveSubTab('study'); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontFamily: 'var(--font-cute)',
              fontSize: '12px',
              backgroundColor: activeSubTab === 'study' ? 'var(--glass-bg)' : 'transparent',
              color: activeSubTab === 'study' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeSubTab === 'study' ? 'var(--shadow-cute)' : 'none',
              transition: 'var(--transition-smooth)'
            }}
          >
            🌸 Daily Study Tracking
          </button>
          
          <button
            onClick={() => { audioSynthesizer.playChime('click'); setActiveSubTab('mock'); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontFamily: 'var(--font-cute)',
              fontSize: '12px',
              backgroundColor: activeSubTab === 'mock' ? 'var(--glass-bg)' : 'transparent',
              color: activeSubTab === 'mock' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeSubTab === 'mock' ? 'var(--shadow-cute)' : 'none',
              transition: 'var(--transition-smooth)'
            }}
          >
            🏆 Mock Test Scores
          </button>
        </div>

        {activeSubTab === 'study' ? (
          // DAILY STUDY TRACKING VIEW
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Simple consistency dashboard cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '14px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>TOTAL HOURS</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Activity size={14} style={{ color: 'var(--accent)' }} /> {totalStudyHours} hrs
                </div>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '14px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>DAILY AVERAGE</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <TrendingUp size={14} style={{ color: '#22c55e' }} /> {avgStudyHours} hrs
                </div>
              </div>
            </div>

            {/* Study Logger Form */}
            <form onSubmit={handleStudySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--accent-light)', padding: '12px', borderRadius: '16px', border: '1px dashed var(--accent)' }}>
              <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ✨ Log Study details for today
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Hours Studied</label>
                  <input
                    type="number"
                    step="0.5"
                    value={studyHours}
                    onChange={(e) => setStudyHours(e.target.value)}
                    className="input-cute"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Topics Completed</label>
                  <input
                    type="number"
                    value={studyTopics}
                    onChange={(e) => setStudyTopics(e.target.value)}
                    className="input-cute"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-cute" style={{ padding: '8px', borderRadius: '10px', fontSize: '11px', marginTop: '4px', width: '100%' }}>
                <Plus size={12} /> Log Study Time
              </button>
            </form>

            {/* History logs list */}
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                📅 Study History Logs
              </span>
              {dailyLogs.length === 0 ? (
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>
                  No study logs recorded yet. Start logging, Bujjithalli! 🌸
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                  {[...dailyLogs].reverse().map((log, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span className="badge badge-low" style={{ fontSize: '9px', padding: '2px 6px' }}>
                          ⏱️ {log.hours} hrs
                        </span>
                        <span className="badge badge-medium" style={{ fontSize: '9px', padding: '2px 6px' }}>
                          ✓ {log.topicsCompleted} topic{log.topicsCompleted !== 1 && 's'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // MOCK TEST SCORES VIEW
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Mock statistics cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '8px', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block' }}>TOTAL TESTS</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', display: 'block' }}>
                  🏆 {totalMockTests}
                </span>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: '8px', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block' }}>AVERAGE SCORE</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#3b82f6', marginTop: '2px', display: 'block' }}>
                  📈 {averageMockScore}/200
                </span>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: '8px', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block' }}>HIGHEST SCORE</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#22c55e', marginTop: '2px', display: 'block' }}>
                  👑 {highestMockScore}/200
                </span>
              </div>
            </div>

            {/* Score entry logger form */}
            <form onSubmit={handleMockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--accent-light)', padding: '12px', borderRadius: '16px', border: '1px dashed var(--accent)' }}>
              <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                📝 Log new Mock Test score
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Score (/200)</label>
                  <input
                    type="number"
                    max="200"
                    min="0"
                    value={mockScore}
                    onChange={(e) => setMockScore(e.target.value)}
                    className="input-cute"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Quick Notes</label>
                  <input
                    type="text"
                    value={mockNotes}
                    onChange={(e) => setMockNotes(e.target.value)}
                    placeholder="Weak in Quant..."
                    className="input-cute"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                  />
                </div>
              </div>
              <button type="submit" className="btn-cute" style={{ padding: '8px', borderRadius: '10px', fontSize: '11px', marginTop: '4px', width: '100%' }}>
                <Plus size={12} /> Log Mock Score
              </button>
            </form>

            {/* Score history list */}
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                📈 Mock Test History
              </span>
              {mockTests.length === 0 ? (
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>
                  No mock tests logged yet. You can do it, Bujjithalli! 🏆
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                  {[...mockTests].reverse().map((mock, idx) => {
                    const tag = mock.score >= 150 ? 'Excellent! 👑' : mock.score >= 120 ? 'Good! ✨' : 'Keep Growing! 💪';
                    const tagClass = mock.score >= 150 ? 'badge-low' : mock.score >= 120 ? 'badge-medium' : 'badge-high';
                    
                    return (
                      <div key={mock.id || idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 10px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {new Date(mock.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-hover)' }}>
                              {mock.score}/200
                            </span>
                            <span className={`badge ${tagClass}`} style={{ fontSize: '8px', padding: '1px 4px' }}>
                              {tag}
                            </span>
                          </div>
                        </div>
                        {mock.notes && (
                          <div style={{ fontSize: '9px', fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: '2px', borderTop: '1px dashed var(--glass-border)', paddingTop: '2px' }}>
                            Note: {mock.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
