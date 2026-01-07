export enum Difficulty {
  EASY = "Easy",
  MEDIUM = "Medium",
  HARD = "High"
}

export enum QuestionType {
  MCQ = "MCQ",
}

export interface Question {
  id: string;
  text: string;
  svg?: string; // For abstract reasoning
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  topic: string;
  difficulty: Difficulty;
}

export enum Mode {
  HANDY = "Handy Mode", // Mental math, quick logic
  PEN_PAPER = "Pen & Paper Mode" // Complex calculation/arrangement
}

export interface TopicDef {
  id: string;
  name: string;
  mode: Mode;
  description: string;
}

export interface UserStats {
  email?: string;
  totalXp?: number;
  [topicId: string]: any; // Relaxed type for dynamic topic keys
}

export interface TopicStat {
  correct: number;
  total: number;
  streak: number;
}