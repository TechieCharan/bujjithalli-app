export interface SyllabusTopic {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  notes: string;
  revisionStatus: 'not_revised' | 'revised_1' | 'revised_2' | 'mastered';
  targetDate?: string;
  targetTime?: string;
  category?: string;
  order?: number;
}

export interface SyllabusSubject {
  id: string;
  name: string;
  topics: SyllabusTopic[];
  order?: number;
  targetDate?: string;
  targetTime?: string;
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
  globalExamDate?: string;
  globalExamName?: string;
}

export type AppTheme = 'cozy-room' | 'night-sky' | 'nature-rain' | 'study-desk' | 'ocean-breeze';
export type AppTab = 'dashboard' | 'syllabus' | 'timer' | 'todo' | 'settings' | 'flashcards';

export interface DailyLog {
  date: string; // YYYY-MM-DD
  hours: number;
  topicsCompleted: number;
}

export interface MockTest {
  id: string;
  date: string;
  score: number; // out of 200
  accuracy?: number; // percentage (0-100)
  timeTaken?: number; // minutes
  weakAreas?: string[]; // e.g. ['Quant', 'English']
  mistakes?: string; // free-text mistake notes
  notes?: string; // general notes
  subject?: string; // optional subject label for filtering
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



