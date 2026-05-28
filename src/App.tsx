import React, { useState, useEffect } from 'react';
import { Home, BookOpen, Clock, CheckSquare, Settings as SettingsIcon } from 'lucide-react';

import type { AppTheme, AppTab, SyllabusSubject, SyllabusTopic, TodoItem, TodoCategory, PriorityLevel, UserProfile, DailyLog, MockTest, FlashcardSet, QuizAttempt } from './types';
import { DEFAULT_SYLLABUS } from './data/syllabus';
import { stateStorage } from './db/storage';
import { audioSynthesizer } from './components/AudioSynthesizer';

// Import Screens
import SmartphoneFrame from './components/SmartphoneFrame';
import Dashboard from './components/Dashboard';
import SyllabusTracker from './components/SyllabusTracker';
import PomodoroTimer from './components/PomodoroTimer';
import TodoList from './components/TodoList';
import Settings from './components/Settings';

// Default mock values for empty state seeding
const INITIAL_TODOS: TodoItem[] = [
  { id: 'todo-1', text: 'Solve 15 Quant algebra questions 📐', completed: false, category: 'study', priority: 'high' },
  { id: 'todo-2', text: 'Revise static GK books & authors list 📚', completed: false, category: 'study', priority: 'medium' },
  { id: 'todo-3', text: 'Drink 8 glasses of water today 💧', completed: false, category: 'health', priority: 'medium' },
  { id: 'todo-4', text: 'Organize study desk & clear drafts ✨', completed: true, category: 'personal', priority: 'low' }
];

const INITIAL_FLASHCARDS: FlashcardSet[] = [
  {
    id: 'set-1',
    title: 'Polity & Constitution 🏛️',
    description: 'Important articles, amendments, and features of the Indian Constitution.',
    category: 'GK / Polity',
    createdAt: Date.now(),
    cards: [
      { id: 'c1', front: 'Article 324', back: 'Superintendence, direction and control of elections to be vested in an Election Commission.', status: 'new' },
      { id: 'c2', front: 'Article 368', back: 'Power of Parliament to amend the Constitution and procedure therefor.', status: 'new' },
      { id: 'c3', front: 'Article 21', back: 'Protection of life and personal liberty.', status: 'new' }
    ]
  },
  {
    id: 'set-2',
    title: 'Quant Quick Formulas 📐',
    description: 'Formulas for algebra, geometry, and arithmetic focus.',
    category: 'Quant 📐',
    createdAt: Date.now(),
    cards: [
      { id: 'q1', front: 'Sum of interior angles of a polygon', back: '(n - 2) * 180 degrees', status: 'new' },
      { id: 'q2', front: 'Area of an equilateral triangle', back: '(sqrt(3) / 4) * a^2', status: 'new' }
    ]
  }
];

// Helper function to safely merge local database state with updated schema defaults.
// Preserves all user study statuses, custom notes, dates, and revision tags.
const mergeSyllabus = (local: SyllabusSubject[], defaults: SyllabusSubject[]): SyllabusSubject[] => {
  if (!local || local.length === 0) return defaults;

  return defaults.map(defaultSubj => {
    const localSubj = local.find(s => s.id === defaultSubj.id);
    if (!localSubj) return defaultSubj;

    // Merge topics
    const mergedTopics = defaultSubj.topics.map(defaultTopic => {
      const localTopic = localSubj.topics.find(t => t.id === defaultTopic.id);
      if (localTopic) {
        // Return existing local state, retaining its details but updating category or name if they changed in defaults
        return {
          ...defaultTopic,
          status: localTopic.status,
          notes: localTopic.notes,
          revisionStatus: localTopic.revisionStatus,
          targetDate: localTopic.targetDate
        };
      }
      return defaultTopic;
    });

    // Also look for legacy local topics that the user has started/modified, and preserve them in a "Legacy/Other" category!
    const legacyTopics = localSubj.topics.filter(localTopic => {
      // It's a legacy topic if it's not in the default list
      const existsInDefault = defaultSubj.topics.some(t => t.id === localTopic.id);
      if (existsInDefault) return false;

      // Keep it only if the user has modified it (completed, added notes, set target date, or revised)
      const hasProgress = localTopic.status !== 'pending' ||
        (localTopic.notes && localTopic.notes.trim() !== '') ||
        localTopic.revisionStatus !== 'not_revised' ||
        localTopic.targetDate;
      return hasProgress;
    }).map(legacyTopic => ({
      ...legacyTopic,
      category: legacyTopic.category || 'Other' // Group it safely
    }));

    return {
      ...defaultSubj,
      topics: [...mergedTopics, ...legacyTopics]
    };
  });
};

export const App: React.FC = () => {
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');

  // Core Data States (Lazy loaded from local storage)
  const [syllabus, setSyllabus] = useState<SyllabusSubject[]>(() => {
    const local = stateStorage.get<SyllabusSubject[]>('syllabus', []);
    return mergeSyllabus(local, DEFAULT_SYLLABUS);
  });

  const [todos, setTodos] = useState<TodoItem[]>(() =>
    stateStorage.get<TodoItem[]>('todos', INITIAL_TODOS)
  );

  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>(() =>
    stateStorage.get<FlashcardSet[]>('flashcard_sets', INITIAL_FLASHCARDS)
  );

  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() =>
    stateStorage.get<QuizAttempt[]>('quiz_attempts', [])
  );

  const [streak, setStreak] = useState<number>(() =>
    stateStorage.get<number>('streak', 0)
  );

  const [profile, setProfile] = useState<UserProfile>(() =>
    stateStorage.get<UserProfile>('profile', { name: 'learning-loop', avatar: '🌱', streak: 0 })
  );

  const [theme, setTheme] = useState<AppTheme>(() =>
    stateStorage.get<AppTheme>('theme', 'cozy-room')
  );

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() =>
    stateStorage.get<boolean>('dark_mode', false)
  );

  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(() =>
    stateStorage.get<DailyLog[]>('daily_logs', [
      { date: '2026-05-18', hours: 5.5, topicsCompleted: 2 },
      { date: '2026-05-19', hours: 6.0, topicsCompleted: 3 },
      { date: '2026-05-20', hours: 4.5, topicsCompleted: 1 }
    ])
  );

  const [mockTests, setMockTests] = useState<MockTest[]>(() =>
    stateStorage.get<MockTest[]>('mock_tests', [
      { id: 'mock-1', date: '2026-05-15', score: 135, notes: 'Felt good in English, Quant needs speed.' },
      { id: 'mock-2', date: '2026-05-19', score: 142, notes: 'Polity questions got fully correct!' }
    ])
  );

  // Sync state changes with LocalStorage
  useEffect(() => { stateStorage.set('syllabus', syllabus); }, [syllabus]);
  useEffect(() => { stateStorage.set('todos', todos); }, [todos]);
  useEffect(() => { stateStorage.set('flashcard_sets', flashcardSets); }, [flashcardSets]);
  useEffect(() => { stateStorage.set('quiz_attempts', quizAttempts); }, [quizAttempts]);
  useEffect(() => { stateStorage.set('streak', streak); }, [streak]);
  useEffect(() => { stateStorage.set('daily_logs', dailyLogs); }, [dailyLogs]);
  useEffect(() => { stateStorage.set('mock_tests', mockTests); }, [mockTests]);

  useEffect(() => {
    stateStorage.set('profile', { ...profile, streak });
  }, [profile, streak]);

  useEffect(() => {
    stateStorage.set('theme', theme);
    // Synchronize HTML classes for HSL dynamic themes
    const rootEl = document.documentElement;
    rootEl.className = `theme-${theme}`;
    if (isDarkMode) {
      rootEl.classList.add('dark-mode');
    } else {
      rootEl.classList.remove('dark-mode');
    }
  }, [theme, isDarkMode]);

  useEffect(() => {
    stateStorage.set('dark_mode', isDarkMode);
  }, [isDarkMode]);

  // Tab Change Handler
  const handleTabChange = (tab: AppTab) => {
    audioSynthesizer.playChime('click');
    setActiveTab(tab);
  };

  // --- CONTROLLERS ---

  // Update Syllabus Topic Details
  const handleUpdateTopic = (subjectId: string, topicId: string, updatedFields: Partial<SyllabusTopic>) => {
    setSyllabus(prev => prev.map(subject => {
      if (subject.id !== subjectId) return subject;
      return {
        ...subject,
        topics: subject.topics.map(topic => {
          if (topic.id !== topicId) return topic;
          return { ...topic, ...updatedFields };
        })
      };
    }));
  };

  const handleAddSubject = (name: string) => {
    setSyllabus(prev => [...prev, { id: `subject_${Date.now()}`, name, topics: [] }]);
  };

  const handleUpdateSubject = (subjectId: string, name: string) => {
    setSyllabus(prev => prev.map(s => s.id === subjectId ? { ...s, name } : s));
  };

  const handleDeleteSubject = (subjectId: string) => {
    setSyllabus(prev => prev.filter(s => s.id !== subjectId));
  };

  const handleAddTopic = (subjectId: string, topic: Omit<SyllabusTopic, 'id'>) => {
    setSyllabus(prev => prev.map(subject => {
      if (subject.id !== subjectId) return subject;
      return { ...subject, topics: [...subject.topics, { ...topic, id: `topic_${Date.now()}` }] };
    }));
  };

  const handleDeleteTopic = (subjectId: string, topicId: string) => {
    setSyllabus(prev => prev.map(subject => {
      if (subject.id !== subjectId) return subject;
      return { ...subject, topics: subject.topics.filter(t => t.id !== topicId) };
    }));
  };

  const handleReorderTopic = (subjectId: string, topicId: string, direction: 'up' | 'down') => {
    setSyllabus(prev => prev.map(subject => {
      if (subject.id !== subjectId) return subject;
      const index = subject.topics.findIndex(t => t.id === topicId);
      if (index < 0) return subject;
      if (direction === 'up' && index === 0) return subject;
      if (direction === 'down' && index === subject.topics.length - 1) return subject;
      
      const newTopics = [...subject.topics];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = newTopics[index];
      newTopics[index] = newTopics[targetIndex];
      newTopics[targetIndex] = temp;
      
      return { ...subject, topics: newTopics };
    }));
  };

  // To-Do Handlers
  const handleAddTodo = (text: string, category: TodoCategory, priority: PriorityLevel, dueDate?: string) => {
    const newTodo: TodoItem = {
      id: `todo_${Date.now()}`,
      text,
      completed: false,
      category,
      priority,
      dueDate
    };
    setTodos(prev => [newTodo, ...prev]);
  };

  const handleToggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  // Streak & Timer Logs
  const handleIncrementStreak = () => {
    setStreak(prev => prev + 1);
  };

  const handleLogSession = (duration: number, type: 'focus' | 'short_break' | 'long_break') => {
    console.log(`Logged session: ${duration}m of ${type}`);
    // Future stats tracker database insertions can happen here
  };

  const handleLogDailyStudy = (hours: number, topicsCompleted: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setDailyLogs(prev => {
      const existing = prev.find(l => l.date === todayStr);
      if (existing) {
        return prev.map(l => l.date === todayStr ? { ...l, hours: l.hours + hours, topicsCompleted: l.topicsCompleted + topicsCompleted } : l);
      }
      return [...prev, { date: todayStr, hours, topicsCompleted }];
    });
  };

  const handleAddMockTest = (
    score: number,
    accuracy?: number,
    timeTaken?: number,
    weakAreas?: string[],
    mistakes?: string,
    notes?: string,
    subject?: string
  ) => {
    const newMock: MockTest = {
      id: `mock_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      score,
      accuracy,
      timeTaken,
      weakAreas,
      mistakes,
      notes,
      subject
    };
    setMockTests(prev => [newMock, ...prev]);
  };

  const handleDeleteMockTest = (id: string) => {
    setMockTests(prev => prev.filter(m => m.id !== id));
  };

  const handleUpdateMockTest = (id: string, updates: Partial<MockTest>) => {
    setMockTests(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };


  // Backup Sync Imports/Exports
  const getFullBackupString = () => {
    return JSON.stringify({
      syllabus,
      todos,
      flashcardSets,
      quizAttempts,
      streak,
      profile,
      theme,
      isDarkMode,
      dailyLogs,
      mockTests
    });
  };

  const handleImportBackup = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.syllabus) setSyllabus(data.syllabus);
      if (data.todos) setTodos(data.todos);
      if (data.flashcardSets) setFlashcardSets(data.flashcardSets);
      if (data.quizAttempts) setQuizAttempts(data.quizAttempts);
      if (data.streak !== undefined) setStreak(data.streak);
      if (data.profile) setProfile(data.profile);
      if (data.theme) setTheme(data.theme);
      if (data.isDarkMode !== undefined) setIsDarkMode(data.isDarkMode);
      if (data.dailyLogs) setDailyLogs(data.dailyLogs);
      if (data.mockTests) setMockTests(data.mockTests);

      // Force instant write
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetData = () => {
    stateStorage.remove('syllabus');
    stateStorage.remove('todos');
    stateStorage.remove('flashcard_sets');
    stateStorage.remove('quiz_attempts');
    stateStorage.remove('streak');
    stateStorage.remove('profile');
    stateStorage.remove('theme');
    stateStorage.remove('dark_mode');
    stateStorage.remove('daily_logs');
    stateStorage.remove('mock_tests');
  };

  // Render Screen Helper
  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            userName={profile.name}
            globalExamDate={profile.globalExamDate}
            syllabus={syllabus}
            todos={todos}
            streak={streak}
            dailyLogs={dailyLogs}
            mockTests={mockTests}
            onLogDailyStudy={handleLogDailyStudy}
            onAddMockTest={handleAddMockTest}
            onDeleteMockTest={handleDeleteMockTest}
            onUpdateMockTest={handleUpdateMockTest}
            onNavigate={(tab) => {
              if (tab === 'syllabus') setActiveTab('syllabus');
              if (tab === 'timer') setActiveTab('timer');
              if (tab === 'todo') setActiveTab('todo');
            }}
          />
        );
      case 'syllabus':
        return (
          <SyllabusTracker
            syllabus={syllabus}
            onUpdateTopic={handleUpdateTopic}
            onAddTopic={handleAddTopic}
            onDeleteTopic={handleDeleteTopic}
            onReorderTopic={handleReorderTopic}
            onAddSubject={handleAddSubject}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
          />
        );
      case 'timer':
        return (
          <PomodoroTimer
            activeTheme={theme}
            streak={streak}
            onIncrementStreak={handleIncrementStreak}
            onLogSession={handleLogSession}
          />
        );
      case 'todo':
        return (
          <TodoList
            todos={todos}
            onAddTodo={handleAddTodo}
            onToggleTodo={handleToggleTodo}
            onDeleteTodo={handleDeleteTodo}
          />
        );
      case 'settings':
        return (
          <Settings
            profile={profile}
            activeTheme={theme}
            isDarkMode={isDarkMode}
            onUpdateProfile={(updated) => setProfile(prev => ({ ...prev, ...updated }))}
            onSelectTheme={setTheme}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            onResetAllData={handleResetData}
            onImportAllData={handleImportBackup}
            exportDataString={getFullBackupString()}
          />
        );
    }
  };

  return (
    <SmartphoneFrame dailyLogs={dailyLogs}>
      {/* Screen Scrolling Content Wrapper */}
      <div className="app-content">
        {renderScreen()}
      </div>

      {/* Screen Navigation Bottom Tab Bar */}
      <div className="app-tab-bar">
        <button
          onClick={() => handleTabChange('dashboard')}
          className={`tab-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <Home className="tab-item-icon" />
          <span className="tab-label">Home</span>
        </button>

        <button
          onClick={() => handleTabChange('syllabus')}
          className={`tab-item ${activeTab === 'syllabus' ? 'active' : ''}`}
        >
          <BookOpen className="tab-item-icon" />
          <span className="tab-label">Syllabus</span>
        </button>

        <button
          onClick={() => handleTabChange('timer')}
          className={`tab-item ${activeTab === 'timer' ? 'active' : ''}`}
        >
          <Clock className="tab-item-icon" />
          <span className="tab-label">Timer</span>
        </button>

        <button
          onClick={() => handleTabChange('todo')}
          className={`tab-item ${activeTab === 'todo' ? 'active' : ''}`}
        >
          <CheckSquare className="tab-item-icon" />
          <span className="tab-label">To-Do</span>
        </button>



        <button
          onClick={() => handleTabChange('settings')}
          className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`}
        >
          <SettingsIcon className="tab-item-icon" />
          <span className="tab-label">Settings</span>
        </button>
      </div>
    </SmartphoneFrame>
  );
};
export default App;
