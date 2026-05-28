import React, { useEffect, useState, useMemo } from 'react';
import {
  Calendar, Flame, Heart, ChevronRight, Award, TrendingUp, Activity,
  Plus, Trash2, AlertTriangle, BookOpen, Target, Clock, BarChart2,
  ChevronDown, ChevronUp, Filter, Pencil, Check, X
} from 'lucide-react';
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
  onAddMockTest: (
    score: number,
    accuracy?: number,
    timeTaken?: number,
    weakAreas?: string[],
    mistakes?: string,
    notes?: string,
    subject?: string
  ) => void;
  onDeleteMockTest: (id: string) => void;
  onUpdateMockTest: (id: string, updates: Partial<MockTest>) => void;
  onNavigate: (tab: 'syllabus' | 'timer' | 'todo' | 'bucket') => void;
}

const BUJJI_QUOTES = [
  "You've got this! 💖",
  "Every small step brings you closer to your dream rank! 👑",
  "Take a deep breath, you are doing amazing! 🌸",
  "Your dedication is inspiring. Focus and shine! ✨",
  "Don't stress, just do your best! ☕",
  "Your exam is just a step, but you are a superstar! 🌟",
  "Work hard in silence, let your score make the noise! 📚",
  "You are capable of doing wonderful things! 💕"
];

const PRESET_SUBJECTS = ['Quant', 'English', 'GK / GS', 'Reasoning', 'General Awareness'];

type MockSortKey = 'latest' | 'highest' | 'lowest' | 'accuracy';

const getScoreColor = (score: number) => {
  if (score >= 160) return '#22c55e';
  if (score >= 140) return '#3b82f6';
  if (score >= 120) return '#f59e0b';
  return '#ef4444';
};

const getScoreLabel = (score: number) => {
  if (score >= 160) return { text: 'Excellent 👑', cls: 'badge-low' };
  if (score >= 140) return { text: 'Good 📈', cls: 'badge-medium' };
  if (score >= 120) return { text: 'Average ☁️', cls: '' };
  return { text: 'Needs Work 💪', cls: 'badge-high' };
};

interface EditState {
  date: string;
  score: string;
  accuracy: string;
  timeTaken: string;
  weakAreas: string[];
  customWeakInput: string;
  mistakes: string;
  notes: string;
  subject: string;
}

const mockToEditState = (m: MockTest): EditState => ({
  date: m.date,
  score: String(m.score),
  accuracy: m.accuracy !== undefined ? String(m.accuracy) : '',
  timeTaken: m.timeTaken !== undefined ? String(m.timeTaken) : '',
  weakAreas: m.weakAreas ?? [],
  customWeakInput: '',
  mistakes: m.mistakes ?? '',
  notes: m.notes ?? '',
  subject: m.subject ?? ''
});

// Reusable weak area chips component
interface WeakAreaPickerProps {
  selected: string[];
  customInput: string;
  onToggle: (area: string) => void;
  onRemoveCustom: (area: string) => void;
  onCustomInputChange: (val: string) => void;
  onAddCustom: () => void;
}

const WeakAreaPicker: React.FC<WeakAreaPickerProps> = ({
  selected, customInput, onToggle, onRemoveCustom, onCustomInputChange, onAddCustom
}) => {
  const customAreas = selected.filter(a => !PRESET_SUBJECTS.includes(a));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Preset chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {PRESET_SUBJECTS.map(area => (
          <button type="button" key={area} onClick={() => onToggle(area)}
            style={{
              padding: '5px 11px', borderRadius: '20px', fontSize: '10px', fontWeight: 600,
              cursor: 'pointer', border: '1.5px solid',
              borderColor: selected.includes(area) ? '#ef4444' : 'var(--glass-border)',
              background: selected.includes(area) ? 'rgba(239,68,68,0.13)' : 'var(--bg-primary)',
              color: selected.includes(area) ? '#ef4444' : 'var(--text-secondary)',
              transition: 'all 0.18s'
            }}>
            {selected.includes(area) ? '✓ ' : ''}{area}
          </button>
        ))}
      </div>
      {/* Custom tag input */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          type="text"
          value={customInput}
          onChange={e => onCustomInputChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddCustom(); } }}
          placeholder="Add custom topic..."
          style={{
            flex: 1, padding: '5px 10px', fontSize: '11px', borderRadius: '10px',
            border: '1.5px solid var(--glass-border)', background: 'var(--bg-primary)',
            color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none'
          }}
        />
        <button type="button" onClick={onAddCustom}
          style={{ padding: '5px 10px', borderRadius: '10px', border: 'none', background: 'var(--accent)', color: 'white', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
          + Add
        </button>
      </div>
      {/* Custom area tags */}
      {customAreas.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {customAreas.map(area => (
            <span key={area} style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600, background: 'rgba(139,92,246,0.12)', color: '#7c3aed', border: '1px solid rgba(139,92,246,0.25)' }}>
              {area}
              <button type="button" onClick={() => onRemoveCustom(area)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', lineHeight: 1, color: '#7c3aed', fontSize: '11px', display: 'flex', alignItems: 'center' }}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({
  userName, syllabus, todos, streak,
  dailyLogs = [], mockTests = [],
  onLogDailyStudy, onAddMockTest, onDeleteMockTest, onUpdateMockTest, onNavigate
}) => {
  const [quote, setQuote] = useState('');
  const [greeting, setGreeting] = useState('Hello');
  const [activeSubTab, setActiveSubTab] = useState<'study' | 'mock'>('study');

  // Study form
  const [studyHours, setStudyHours] = useState('4');
  const [studyTopics, setStudyTopics] = useState('1');

  // New mock form
  const [mockScore, setMockScore] = useState('130');
  const [mockAccuracy, setMockAccuracy] = useState('');
  const [mockTimeTaken, setMockTimeTaken] = useState('');
  const [mockWeakAreas, setMockWeakAreas] = useState<string[]>([]);
  const [mockCustomWeak, setMockCustomWeak] = useState('');
  const [mockMistakes, setMockMistakes] = useState('');
  const [mockNotes, setMockNotes] = useState('');
  const [mockSubject, setMockSubject] = useState('');
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);

  // History controls
  const [sortKey, setSortKey] = useState<MockSortKey>('latest');
  const [filterSubject, setFilterSubject] = useState('all');
  const [showMistakesPanel, setShowMistakesPanel] = useState(false);
  const [expandedMockId, setExpandedMockId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);

  useEffect(() => {
    setQuote(BUJJI_QUOTES[Math.floor(Math.random() * BUJJI_QUOTES.length)]);
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good Morning ☀️' : h < 17 ? 'Good Afternoon ☁️' : 'Good Evening 🌙');
  }, [userName]);

  // Syllabus
  let totalTopics = 0, completedTopics = 0;
  syllabus.forEach(s => s.topics.forEach(t => { totalTopics++; if (t.status === 'completed') completedTopics++; }));
  const syllabusPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const radius = 60, circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (syllabusPercent / 100) * circumference;

  // Todos
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const dashboardTodos = todos.filter(t => !t.completed)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 3);

  // Study stats
  const totalStudyHours = dailyLogs.reduce((acc, l) => acc + l.hours, 0);
  const avgStudyHours = dailyLogs.length > 0 ? (totalStudyHours / dailyLogs.length).toFixed(1) : '0';

  // Mock analytics
  const highestMockScore = mockTests.length > 0 ? Math.max(...mockTests.map(m => m.score)) : 0;
  const chronoMocks = useMemo(() => [...mockTests].sort((a, b) => a.date.localeCompare(b.date)), [mockTests]);
  const latestMock = chronoMocks[chronoMocks.length - 1];
  const prevMock = chronoMocks[chronoMocks.length - 2];
  const scoreDelta = latestMock && prevMock ? latestMock.score - prevMock.score : null;

  const weakAreaFreq = useMemo(() => {
    const freq: Record<string, number> = {};
    mockTests.forEach(m => (m.weakAreas ?? []).forEach(a => { freq[a] = (freq[a] || 0) + 1; }));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]);
  }, [mockTests]);

  const mistakesToRevise = useMemo(() =>
    mockTests.filter(m => m.mistakes?.trim()).map(m => ({ id: m.id, date: m.date, mistakes: m.mistakes!, score: m.score })),
    [mockTests]);

  const accuracyTrend = useMemo(() =>
    mockTests.filter(m => m.accuracy !== undefined).sort((a, b) => a.date.localeCompare(b.date)).slice(-5),
    [mockTests]);

  const subjectOptions = useMemo(() => {
    const s = new Set<string>();
    mockTests.forEach(m => { if (m.subject) s.add(m.subject); });
    return Array.from(s);
  }, [mockTests]);

  const sortedMocks = useMemo(() => {
    let list = [...mockTests];
    if (filterSubject !== 'all') list = list.filter(m => m.subject === filterSubject);
    if (sortKey === 'latest') list.sort((a, b) => b.date.localeCompare(a.date));
    else if (sortKey === 'highest') list.sort((a, b) => b.score - a.score);
    else if (sortKey === 'lowest') list.sort((a, b) => a.score - b.score);
    else list.sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0));
    return list;
  }, [mockTests, sortKey, filterSubject]);

  // ---- Handlers ----
  const handleStudySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(studyHours), t = parseInt(studyTopics, 10);
    if (isNaN(h) || h <= 0 || isNaN(t) || t < 0) return;
    audioSynthesizer.playChime('complete');
    onLogDailyStudy(h, t);
    alert('Logged study details for today! Keep up the magic');
    setStudyHours('4'); setStudyTopics('1');
  };

  const handleMockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sc = parseInt(mockScore, 10);
    if (isNaN(sc) || sc < 0 || sc > 200) { alert('Please enter a valid score (0–200)!'); return; }
    audioSynthesizer.playChime('complete');
    onAddMockTest(sc,
      mockAccuracy ? parseFloat(mockAccuracy) : undefined,
      mockTimeTaken ? parseFloat(mockTimeTaken) : undefined,
      mockWeakAreas.length > 0 ? [...mockWeakAreas] : undefined,
      mockMistakes.trim() || undefined,
      mockNotes.trim() || undefined,
      mockSubject || undefined
    );
    alert(`Mock test logged! Score: ${sc}/200. Proud of you! 🏆`);
    setMockScore('130'); setMockAccuracy(''); setMockTimeTaken('');
    setMockWeakAreas([]); setMockCustomWeak(''); setMockMistakes('');
    setMockNotes(''); setMockSubject(''); setShowAdvancedForm(false);
  };

  // New form weak area helpers
  const toggleNewWeak = (a: string) =>
    setMockWeakAreas(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a]);
  const removeNewWeak = (a: string) => setMockWeakAreas(p => p.filter(x => x !== a));
  const addNewCustomWeak = () => {
    const v = mockCustomWeak.trim();
    if (v && !mockWeakAreas.includes(v)) setMockWeakAreas(p => [...p, v]);
    setMockCustomWeak('');
  };

  // Edit helpers
  const startEdit = (mock: MockTest) => {
    audioSynthesizer.playChime('click');
    setEditingId(mock.id);
    setEditState(mockToEditState(mock));
    setExpandedMockId(mock.id);
    setConfirmDeleteId(null);
  };
  const cancelEdit = () => { setEditingId(null); setEditState(null); setExpandedMockId(null); };
  const saveEdit = (id: string) => {
    if (!editState) return;
    const sc = parseInt(editState.score, 10);
    if (isNaN(sc) || sc < 0 || sc > 200) { alert('Score must be 0–200!'); return; }
    if (!editState.date) { alert('Please select a valid date!'); return; }
    audioSynthesizer.playChime('complete');
    onUpdateMockTest(id, {
      date: editState.date, score: sc,
      accuracy: editState.accuracy ? parseFloat(editState.accuracy) : undefined,
      timeTaken: editState.timeTaken ? parseFloat(editState.timeTaken) : undefined,
      weakAreas: editState.weakAreas.length > 0 ? [...editState.weakAreas] : undefined,
      mistakes: editState.mistakes.trim() || undefined,
      notes: editState.notes.trim() || undefined,
      subject: editState.subject || undefined
    });
    // Collapse the card fully after saving
    setEditingId(null); setEditState(null); setExpandedMockId(null);
  };
  const toggleEditWeak = (a: string) =>
    setEditState(p => p ? { ...p, weakAreas: p.weakAreas.includes(a) ? p.weakAreas.filter(x => x !== a) : [...p.weakAreas, a] } : p);
  const removeEditWeak = (a: string) =>
    setEditState(p => p ? { ...p, weakAreas: p.weakAreas.filter(x => x !== a) } : p);
  const addEditCustomWeak = () => {
    if (!editState) return;
    const v = editState.customWeakInput.trim();
    if (v && !editState.weakAreas.includes(v))
      setEditState(p => p ? { ...p, weakAreas: [...p.weakAreas, v], customWeakInput: '' } : p);
    else setEditState(p => p ? { ...p, customWeakInput: '' } : p);
  };
  const handleDeleteConfirm = (id: string) => {
    audioSynthesizer.playChime('click');
    onDeleteMockTest(id);
    setConfirmDeleteId(null);
    if (expandedMockId === id) setExpandedMockId(null);
  };

  // ---- Shared Styles ----
  const statCardStyle: React.CSSProperties = { background: 'var(--bg-primary)', padding: '10px', borderRadius: '14px', border: '1px solid var(--glass-border)', textAlign: 'center' };
  const labelStyle: React.CSSProperties = { fontSize: '8px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', letterSpacing: '0.5px' };
  const valueStyle: React.CSSProperties = { fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '3px', display: 'block', fontFamily: 'var(--font-cute)' };
  const fieldStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '7px 10px', fontSize: '12px', borderRadius: '10px', border: '1.5px solid var(--accent)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none' };
  const lbl: React.CSSProperties = { fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '4px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

      {/* Welcome Banner */}
      <div className="glass-panel" style={{ padding: '22px', textAlign: 'center', background: 'linear-gradient(135deg, var(--glass-bg), var(--accent-light))' }}>
        <span className="badge" style={{ backgroundColor: 'var(--accent)', color: 'white', marginBottom: '8px' }}>Welcome back! ✨</span>
        <h1 className="cute-title" style={{ fontSize: '22px', margin: '4px 0' }}>{greeting}, {userName}!</h1>
        <p className="cute-subtitle" style={{ fontSize: '13px', margin: '8px 0 0 0', fontStyle: 'italic', lineHeight: '1.4' }}>"{quote}"</p>
      </div>

      {/* Syllabus + Streak grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', fontFamily: 'var(--font-cute)' }}>SYLLABUS</span>
          <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="65" cy="65" r={radius} fill="transparent" stroke="var(--glass-border)" strokeWidth="10" />
              <circle cx="65" cy="65" r={radius} fill="transparent" stroke="var(--accent)" strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-cute)' }}>{syllabusPercent}%</span>
              <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-secondary)' }}>{completedTopics}/{totalTopics} topics</span>
            </div>
          </div>
          <button className="btn-cute btn-cute-secondary" style={{ width: '100%', padding: '6px 10px', fontSize: '11px', marginTop: '12px', borderRadius: '12px' }} onClick={() => onNavigate('syllabus')}>Track <ChevronRight size={12} /></button>
        </div>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px', fontFamily: 'var(--font-cute)' }}>STUDY STREAK</span>
          <div style={{ position: 'relative', margin: '6px 0 10px 0', transform: streak > 0 ? 'scale(1.1)' : 'none', transition: 'transform 0.5s' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--accent)', color: 'var(--accent-hover)' }}>
              {streak > 0 ? <Flame size={36} fill="var(--accent)" stroke="none" /> : <Award size={36} />}
            </div>
            {streak > 0 && <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#e11d48', padding: '2px 6px', borderRadius: '10px', color: 'white', fontSize: '9px', fontWeight: 'bold' }}>HOT! 🔥</div>}
          </div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-cute)' }}>{streak} Study {streak === 1 ? 'Day' : 'Days'}</span>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{streak > 0 ? 'Doing wonderful!' : 'Start focusing today!'}</span>
          <button className="btn-cute" style={{ width: '100%', padding: '6px 10px', fontSize: '11px', marginTop: '12px', borderRadius: '12px' }} onClick={() => onNavigate('timer')}>Start Timer <ChevronRight size={12} /></button>
        </div>
      </div>

      {/* Critical Tasks */}
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-cute)', color: 'var(--text-primary)' }}>🎯 Critical Tasks Today</h3>
          <span style={{ fontSize: '11px', color: 'var(--accent-hover)', fontWeight: 700, cursor: 'pointer' }} onClick={() => onNavigate('todo')}>View all</span>
        </div>
        {dashboardTodos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-secondary)' }}>
            <Heart size={24} style={{ color: 'var(--accent)', marginBottom: '8px', opacity: 0.6 }} />
            <p style={{ fontSize: '12px' }}>No pending urgent tasks today!</p>
          </div>
        ) : dashboardTodos.map(todo => (
          <div key={todo.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-primary)', border: '1.5px solid var(--glass-border)', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <span style={{ fontSize: '14px' }}>{todo.category === 'study' ? '📚' : todo.category === 'personal' ? '🌸' : todo.category === 'health' ? '🏃‍♀️' : '⭐'}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{todo.text}</span>
            </div>
            <span className={`badge badge-${todo.priority}`} style={{ textTransform: 'capitalize', flexShrink: 0 }}>{todo.priority}</span>
          </div>
        ))}
      </div>

      {/* === STUDY LOGS & MOCK TEST PANEL === */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Sub-tab switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '14px', padding: '4px' }}>
          {(['study', 'mock'] as const).map(tab => (
            <button key={tab} onClick={() => { audioSynthesizer.playChime('click'); setActiveSubTab(tab); }}
              style={{ flex: 1, padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-cute)', fontSize: '12px', backgroundColor: activeSubTab === tab ? 'var(--glass-bg)' : 'transparent', color: activeSubTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: activeSubTab === tab ? 'var(--shadow-cute)' : 'none', transition: 'var(--transition-smooth)' }}>
              {tab === 'study' ? '🌸 Daily Study Tracking' : '🏆 Mock Test Scores'}
            </button>
          ))}
        </div>

        {activeSubTab === 'study' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={statCardStyle}><span style={labelStyle}>TOTAL HOURS</span><div style={{ ...valueStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Activity size={14} style={{ color: 'var(--accent)' }} /> {totalStudyHours} hrs</div></div>
              <div style={statCardStyle}><span style={labelStyle}>DAILY AVERAGE</span><div style={{ ...valueStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><TrendingUp size={14} style={{ color: '#22c55e' }} /> {avgStudyHours} hrs</div></div>
            </div>
            <form onSubmit={handleStudySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--accent-light)', padding: '12px', borderRadius: '16px', border: '1px dashed var(--accent)' }}>
              <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>✨ Log Study details for today</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><label style={lbl}>Hours Studied</label><input type="number" step="0.5" value={studyHours} onChange={e => setStudyHours(e.target.value)} className="input-cute" style={{ padding: '6px 10px', fontSize: '12px' }} required /></div>
                <div><label style={lbl}>Topics Completed</label><input type="number" value={studyTopics} onChange={e => setStudyTopics(e.target.value)} className="input-cute" style={{ padding: '6px 10px', fontSize: '12px' }} required /></div>
              </div>
              <button type="submit" className="btn-cute" style={{ padding: '8px', borderRadius: '10px', fontSize: '11px', width: '100%' }}><Plus size={12} /> Log Study Time</button>
            </form>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>📅 Study History Logs</span>
              {dailyLogs.length === 0 ? (
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>No study logs yet. Start logging</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                  {[...dailyLogs].reverse().map((log, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span className="badge badge-low" style={{ fontSize: '9px', padding: '2px 6px' }}>⏱️ {log.hours} hrs</span>
                        <span className="badge badge-medium" style={{ fontSize: '9px', padding: '2px 6px' }}>✓ {log.topicsCompleted} topic{log.topicsCompleted !== 1 && 's'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* === MOCK TEST TAB === */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div style={statCardStyle}><span style={labelStyle}>TOTAL TESTS</span><span style={valueStyle}>🏆 {mockTests.length}</span></div>
              <div style={statCardStyle}><span style={labelStyle}>HIGHEST</span><span style={{ ...valueStyle, color: '#22c55e' }}>👑 {highestMockScore}/200</span></div>
              <div style={statCardStyle}><span style={labelStyle}>TREND</span><span style={{ ...valueStyle, color: scoreDelta === null ? 'var(--text-secondary)' : scoreDelta >= 0 ? '#22c55e' : '#ef4444' }}>{scoreDelta === null ? '—' : scoreDelta >= 0 ? `▲+${scoreDelta}` : `▼${scoreDelta}`}</span></div>
            </div>

            {/* Weak areas summary */}
            {weakAreaFreq.length > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <AlertTriangle size={13} style={{ color: '#ef4444' }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>Recurring Weak Areas</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {weakAreaFreq.map(([area, count]) => (
                    <span key={area} style={{ padding: '3px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: count >= 3 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: count >= 3 ? '#ef4444' : '#d97706', border: `1px solid ${count >= 3 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}` }}>{area} ({count}×)</span>
                  ))}
                </div>
              </div>
            )}

            {/* Accuracy trend */}
            {accuracyTrend.length > 1 && (
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <BarChart2 size={13} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>Accuracy Trend (last {accuracyTrend.length})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '40px' }}>
                  {accuracyTrend.map((m, i) => {
                    const acc = m.accuracy ?? 0;
                    return (
                      <div key={m.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <span style={{ fontSize: '8px', color: 'var(--text-secondary)', fontWeight: 600 }}>{acc}%</span>
                        <div style={{ width: '100%', height: `${Math.max(6, (acc / 100) * 40)}px`, borderRadius: '4px', background: i === accuracyTrend.length - 1 ? 'var(--accent)' : 'var(--glass-border)', transition: 'height 0.4s' }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mistakes to Revise panel */}
            {mistakesToRevise.length > 0 && (
              <div>
                <button onClick={() => setShowMistakesPanel(p => !p)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '14px', border: '1.5px dashed #f59e0b', background: 'rgba(245,158,11,0.07)', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={13} style={{ color: '#f59e0b' }} />
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>📌 Mistakes to Revise ({mistakesToRevise.length})</span>
                  </div>
                  {showMistakesPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showMistakesPanel && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {mistakesToRevise.map(item => (
                      <div key={item.id} style={{ padding: '8px 10px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            {new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {item.score}/200
                          </span>
                          <span className="badge badge-high" style={{ fontSize: '8px', padding: '1px 6px' }}>Revise</span>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: '1.4', margin: 0 }}>{item.mistakes}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Log new mock test form */}
            <form onSubmit={handleMockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--accent-light)', padding: '12px', borderRadius: '16px', border: '1px dashed var(--accent)' }}>
              <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>📝 Log New Mock Test</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><label style={lbl}>Score (/200) *</label><input type="number" max="200" min="0" value={mockScore} onChange={e => setMockScore(e.target.value)} className="input-cute" style={{ padding: '6px 10px', fontSize: '12px' }} required /></div>
                <div><label style={lbl}>Accuracy %</label><input type="number" max="100" min="0" value={mockAccuracy} onChange={e => setMockAccuracy(e.target.value)} placeholder="e.g. 78" className="input-cute" style={{ padding: '6px 10px', fontSize: '12px' }} /></div>
              </div>
              <button type="button" onClick={() => setShowAdvancedForm(p => !p)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-hover)', fontSize: '10px', fontWeight: 700, textAlign: 'left', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Filter size={10} /> {showAdvancedForm ? 'Hide' : 'Show'} details {showAdvancedForm ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
              {showAdvancedForm && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div><label style={lbl}><Clock size={9} style={{ verticalAlign: 'middle', marginRight: '2px' }} />Time Taken (min)</label><input type="number" min="0" value={mockTimeTaken} onChange={e => setMockTimeTaken(e.target.value)} placeholder="e.g. 120" className="input-cute" style={{ padding: '6px 10px', fontSize: '12px' }} /></div>
                    <div><label style={lbl}><Target size={9} style={{ verticalAlign: 'middle', marginRight: '2px' }} />Subject Tag</label>
                      <select value={mockSubject} onChange={e => setMockSubject(e.target.value)} className="input-cute" style={{ padding: '6px 10px', fontSize: '12px' }}>
                        <option value="">— None —</option>
                        {PRESET_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}><AlertTriangle size={9} style={{ verticalAlign: 'middle', color: '#ef4444', marginRight: '2px' }} />Weak Areas (select or type custom)</label>
                    <WeakAreaPicker
                      selected={mockWeakAreas} customInput={mockCustomWeak}
                      onToggle={toggleNewWeak} onRemoveCustom={removeNewWeak}
                      onCustomInputChange={setMockCustomWeak} onAddCustom={addNewCustomWeak}
                    />
                  </div>
                  <div><label style={lbl}><BookOpen size={9} style={{ verticalAlign: 'middle', marginRight: '2px' }} />Mistakes / Things to Revise</label>
                    <textarea value={mockMistakes} onChange={e => setMockMistakes(e.target.value)} placeholder="e.g. Confused SI/CI formulas, missed polity questions..." className="input-cute" style={{ padding: '8px 10px', fontSize: '11px', width: '100%', minHeight: '56px', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                  <div><label style={lbl}>📝 General Notes</label>
                    <input type="text" value={mockNotes} onChange={e => setMockNotes(e.target.value)} placeholder="e.g. Felt good, English was easy..." className="input-cute" style={{ padding: '6px 10px', fontSize: '12px' }} />
                  </div>
                </div>
              )}
              <button type="submit" className="btn-cute" style={{ padding: '9px', borderRadius: '10px', fontSize: '12px', width: '100%' }}><Plus size={12} /> Log Mock Score</button>
            </form>

            {/* History */}
            {mockTests.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>📈 Test History</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select value={sortKey} onChange={e => setSortKey(e.target.value as MockSortKey)}
                      style={{ fontSize: '9px', fontWeight: 700, padding: '3px 6px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <option value="latest">Latest First</option>
                      <option value="highest">Highest Score</option>
                      <option value="lowest">Lowest Score</option>
                      <option value="accuracy">By Accuracy</option>
                    </select>
                    {subjectOptions.length > 0 && (
                      <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
                        style={{ fontSize: '9px', fontWeight: 700, padding: '3px 6px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <option value="all">All Subjects</option>
                        {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: editingId ? 'none' : '400px', overflowY: editingId ? 'visible' : 'auto' }}>
                  {sortedMocks.map((mock, idx) => {
                    const chronoIdx = chronoMocks.findIndex(m => m.id === mock.id);
                    const prevScore = chronoIdx > 0 ? chronoMocks[chronoIdx - 1].score : null;
                    const delta = prevScore !== null ? mock.score - prevScore : null;
                    const label = getScoreLabel(mock.score);
                    const isExpanded = expandedMockId === mock.id;
                    const isEditing = editingId === mock.id;
                    const scoreColor = getScoreColor(mock.score);

                    return (
                      <div key={mock.id || idx} style={{ borderRadius: '14px', background: 'var(--bg-primary)', border: `1.5px solid var(--glass-border)`, borderLeft: `4px solid ${isEditing ? 'var(--accent)' : scoreColor}`, overflow: 'hidden' }}>

                        {/* ── Card Header ── */}
                        <div onClick={() => { if (!isEditing) setExpandedMockId(isExpanded ? null : mock.id); }}
                          style={{ display: 'flex', alignItems: 'flex-start', padding: '10px 12px', gap: '10px', cursor: isEditing ? 'default' : 'pointer' }}>

                          {/* Score circle */}
                          <div style={{ width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0, background: `${scoreColor}18`, border: `2.5px solid ${scoreColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{mock.score}</span>
                            <span style={{ fontSize: '7px', color: scoreColor, fontWeight: 600, opacity: 0.7 }}>/200</span>
                          </div>

                          {/* Info column — stacked, no overflow crowding */}
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {/* Row 1: Date */}
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                              📅 {new Date(mock.date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            {/* Row 2: Badges */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                              <span className={`badge ${label.cls}`} style={{ fontSize: '8px', padding: '1px 6px' }}>{label.text}</span>
                              {delta !== null && (
                                <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 6px', borderRadius: '6px', color: delta >= 0 ? '#22c55e' : '#ef4444', background: delta >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }}>
                                  {delta >= 0 ? `▲ +${delta}` : `▼ ${delta}`}
                                </span>
                              )}
                            </div>
                            {/* Row 3: Metrics */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {mock.accuracy !== undefined && <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600 }}>🎯 {mock.accuracy}%</span>}
                              {mock.timeTaken !== undefined && <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600 }}>⏱ {mock.timeTaken}m</span>}
                              {mock.subject && <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600 }}>📚 {mock.subject}</span>}
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0, alignItems: 'center' }}>
                            {!isEditing && (
                              <button type="button" onClick={e => { e.stopPropagation(); startEdit(mock); }} title="Edit"
                                style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: '8px', padding: '5px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--accent-hover)' }}>
                                <Pencil size={11} />
                              </button>
                            )}
                            {!isEditing && (isExpanded ? <ChevronUp size={14} style={{ color: 'var(--text-secondary)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />)}
                          </div>
                        </div>

                        {/* ── EDIT MODE ── */}
                        {isEditing && editState && (
                          <div style={{ padding: '0 12px 14px', borderTop: '1px dashed var(--accent)', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '0' }}>
                            <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-hover)', margin: '10px 0 0 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Pencil size={11} /> Editing this entry
                            </p>

                            {/* Date + Score */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div>
                                <label style={lbl}>📅 Date *</label>
                                <input type="date" value={editState.date}
                                  onChange={e => setEditState(p => p ? { ...p, date: e.target.value } : p)}
                                  style={fieldStyle} />
                              </div>
                              <div>
                                <label style={lbl}>🏆 Score (/200) *</label>
                                <input type="number" min="0" max="200" value={editState.score}
                                  onChange={e => setEditState(p => p ? { ...p, score: e.target.value } : p)}
                                  style={fieldStyle} />
                              </div>
                            </div>

                            {/* Accuracy + Time */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div>
                                <label style={lbl}>🎯 Accuracy %</label>
                                <input type="number" min="0" max="100" value={editState.accuracy} placeholder="e.g. 78"
                                  onChange={e => setEditState(p => p ? { ...p, accuracy: e.target.value } : p)}
                                  style={fieldStyle} />
                              </div>
                              <div>
                                <label style={lbl}><Clock size={9} style={{ verticalAlign: 'middle' }} /> Time (min)</label>
                                <input type="number" min="0" value={editState.timeTaken} placeholder="e.g. 120"
                                  onChange={e => setEditState(p => p ? { ...p, timeTaken: e.target.value } : p)}
                                  style={fieldStyle} />
                              </div>
                            </div>

                            {/* Subject */}
                            <div>
                              <label style={lbl}><Target size={9} style={{ verticalAlign: 'middle' }} /> Subject Tag</label>
                              <select value={editState.subject} onChange={e => setEditState(p => p ? { ...p, subject: e.target.value } : p)} style={fieldStyle}>
                                <option value="">— None —</option>
                                {PRESET_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>

                            {/* Weak Areas — full picker */}
                            <div>
                              <label style={lbl}><AlertTriangle size={9} style={{ verticalAlign: 'middle', color: '#ef4444' }} /> Weak Areas (multiple allowed)</label>
                              <WeakAreaPicker
                                selected={editState.weakAreas}
                                customInput={editState.customWeakInput}
                                onToggle={toggleEditWeak}
                                onRemoveCustom={removeEditWeak}
                                onCustomInputChange={v => setEditState(p => p ? { ...p, customWeakInput: v } : p)}
                                onAddCustom={addEditCustomWeak}
                              />
                            </div>

                            {/* Mistakes */}
                            <div>
                              <label style={lbl}><BookOpen size={9} style={{ verticalAlign: 'middle' }} /> Mistakes / Revise Notes</label>
                              <textarea value={editState.mistakes}
                                onChange={e => setEditState(p => p ? { ...p, mistakes: e.target.value } : p)}
                                placeholder="Mistakes to remember and revise..."
                                style={{ ...fieldStyle, minHeight: '52px', resize: 'vertical' }} />
                            </div>

                            {/* Notes */}
                            <div>
                              <label style={lbl}>📝 General Notes</label>
                              <input type="text" value={editState.notes}
                                onChange={e => setEditState(p => p ? { ...p, notes: e.target.value } : p)}
                                placeholder="e.g. English was easy today..."
                                style={fieldStyle} />
                            </div>

                            {/* Save / Cancel — sticky so they're always reachable */}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', position: 'sticky', bottom: 0, background: 'var(--bg-primary)', paddingTop: '8px', paddingBottom: '2px', zIndex: 2 }}>
                              <button type="button" onClick={() => saveEdit(mock.id)}
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '9px', borderRadius: '10px', border: 'none', background: 'var(--accent)', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                <Check size={13} /> Save Changes
                              </button>
                              <button type="button" onClick={cancelEdit}
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '9px', borderRadius: '10px', border: '1.5px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                <X size={13} /> Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ── EXPANDED VIEW (read-only) ── */}
                        {isExpanded && !isEditing && (
                          <div style={{ padding: '10px 12px 12px', borderTop: '1px dashed var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>

                            {/* Weak Areas */}
                            {mock.weakAreas && mock.weakAreas.length > 0 && (
                              <div>
                                <span style={{ fontSize: '9px', color: '#ef4444', fontWeight: 700, display: 'block', marginBottom: '5px' }}>⚠ Weak Areas</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                  {mock.weakAreas.map(a => (
                                    <span key={a} style={{ padding: '3px 9px', borderRadius: '12px', fontSize: '10px', fontWeight: 600, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>{a}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Mistakes */}
                            {mock.mistakes && (
                              <div style={{ padding: '8px 10px', borderRadius: '10px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                <span style={{ fontSize: '9px', color: '#d97706', fontWeight: 700, display: 'block', marginBottom: '4px' }}>📌 Mistakes / Revise</span>
                                <p style={{ fontSize: '11px', color: 'var(--text-primary)', margin: 0, lineHeight: '1.5' }}>{mock.mistakes}</p>
                              </div>
                            )}

                            {/* Notes */}
                            {mock.notes && (
                              <div style={{ padding: '8px 10px', borderRadius: '10px', background: 'var(--accent-light)', border: '1px solid var(--glass-border)' }}>
                                <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>📝 General Notes</span>
                                <p style={{ fontSize: '11px', color: 'var(--text-primary)', margin: 0, fontStyle: 'italic', lineHeight: '1.5' }}>{mock.notes}</p>
                              </div>
                            )}

                            {/* Pacing insight */}
                            {mock.timeTaken && (
                              <div style={{ padding: '7px 10px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                                <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700 }}>⚡ Pacing Insight</span>
                                <p style={{ fontSize: '10px', color: 'var(--text-primary)', margin: '3px 0 0 0' }}>
                                  ~{(mock.timeTaken / 200).toFixed(1)} min/question •{' '}
                                  {mock.timeTaken <= 120 ? 'Fast paced — check for careless errors!' : mock.timeTaken <= 150 ? 'Good timing balance.' : 'Spent extra time — work on speed!'}
                                </p>
                              </div>
                            )}

                            {/* Delete controls */}
                            <div style={{ marginTop: '2px' }}>
                              {confirmDeleteId === mock.id ? (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button type="button" onClick={() => handleDeleteConfirm(mock.id)}
                                    style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1.5px solid #ef4444', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                                    Confirm Delete
                                  </button>
                                  <button type="button" onClick={() => setConfirmDeleteId(null)}
                                    style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button type="button" onClick={() => setConfirmDeleteId(mock.id)}
                                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'none', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
                                  <Trash2 size={11} /> Remove Entry
                                </button>
                              )}
                            </div>

                            {/* Close / Collapse button */}
                            <button
                              type="button"
                              onClick={() => setExpandedMockId(null)}
                              style={{
                                width: '100%', padding: '7px', borderRadius: '10px',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-secondary)',
                                fontSize: '11px', fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                marginTop: '2px'
                              }}>
                              <ChevronUp size={13} /> Close
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {mockTests.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)' }}>
                <Target size={28} style={{ color: 'var(--accent)', marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ fontSize: '12px' }}>No mock tests logged yet.</p>
                <p style={{ fontSize: '10px', opacity: 0.7 }}>Log your first test above and start tracking progress! 🏆</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Quote */}
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--accent-light)', border: '1px dashed var(--accent)' }}>
        <Calendar size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 500, lineHeight: '1.4' }}>
          <strong>Study Target</strong>: Master 1 topic today, revise for 10 minutes on your Pomodoro breaks, and write down 1 big dream! 💕
        </span>
      </div>
    </div>
  );
};

export default Dashboard;
