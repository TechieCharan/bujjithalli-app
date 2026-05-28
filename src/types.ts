export interface SyllabusTopic {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  notes: string;
  revisionStatus: 'not_revised' | 'revised_1' | 'revised_2' | 'mastered';
  targetDate?: string;
  category?: string;
}

export interface SyllabusSubject {
  id: string;
  name: string;
  topics: SyllabusTopic[];
}

export type TodoCategory = 'study' | 'personal' | 'health' | 'misc';
export type PriorityLevel = 'high' | 'medium' | 'low';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  category: TodoCategory;
  priority: PriorityLevel;
  dueDate?: string;
}

export interface BucketItem {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string; // base64 encoded image data URL stored in IndexedDB
  completed: boolean;
  targetDate?: string;
}

export interface StudySession {
  id: string;
  duration: number; // minutes focused
  timestamp: number; // millisecond timestamp
  type: 'focus' | 'short_break' | 'long_break';
}

export interface UserProfile {
  name: string;
  avatar: string;
  streak: number;
  lastActiveDate?: string;
}

export type AppTheme = 'cozy-room' | 'night-sky' | 'nature-rain' | 'study-desk' | 'ocean-breeze';
export type AppTab = 'dashboard' | 'syllabus' | 'timer' | 'todo' | 'bucket' | 'settings' | 'flashcards';

export interface DailyLog {
  date: string; // YYYY-MM-DD
  hours: number;
  topicsCompleted: number;
}

export interface MockTest {
  id: string;
  date: string;
  score: number; // out of 200
  notes?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  status: 'new' | 'learning' | 'mastered';
  lastStudied?: number;
}

export interface FlashcardSet {
  id: string;
  title: string;
  description: string;
  category?: string;
  cards: Flashcard[];
  createdAt: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  selectedAnswer?: string;
  isCorrect?: boolean;
}

export interface QuizAttempt {
  id: string;
  setId: string;
  setTitle: string;
  score: number;
  totalQuestions: number;
  timeSpent: number; // in seconds
  averageSpeed: number; // seconds per question
  accuracy: number; // percentage
  efficiencyScore: number; // calculated index (0-100)
  date: string; // YYYY-MM-DD
  timestamp: number;
  strategy?: 'mcq' | 'tf' | 'type_in' | 'matching';
}



