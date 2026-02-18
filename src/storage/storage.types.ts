export interface Section {
  id: number;
  title: string;
  content: string;
}

export interface DocumentMeta {
  id: string;
  url: string;
  title: string;
  hash: string;
  createdAt: string;
  updatedAt: string;
}

export interface TranslatedDocument {
  sections: Section[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface SectionChat {
  sectionId: number;
  messages: ChatMessage[];
}

export type QuizType = 'multiple_choice' | 'short_answer' | 'explanation';

export interface Quiz {
  type: QuizType;
  question: string;
  options?: string[]; // 객관식일 때만
}

export interface QuizResult {
  quizIndex: number;
  userAnswer: string;
  score: number; // 0-100
  feedback: string;
}

export interface QuizRecord {
  quizzes: Quiz[];
  results: QuizResult[];
}
