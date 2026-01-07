import { Mode, TopicDef } from './types';

export const APP_NAME = "COSMIC LOGIC CET";
export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbybiIeuH0EcBpSL31HdlGAQoVeW4nye3UXRXBVL1zUFJnZs_UsZAI3Nb4MLRsrzk2kj/exec";

export const SYLLABUS: TopicDef[] = [
  // Handy Mode Topics (Mental/Quick)
  { id: 'syllogisms', name: 'Syllogisms', mode: Mode.HANDY, description: 'Venn diagram logic, usually 2-3 statements.' },
  { id: 'inequalities', name: 'Inequalities', mode: Mode.HANDY, description: 'Relationship between elements (>, <, =).' },
  { id: 'coding_simple', name: 'Coding/Decoding (Basic)', mode: Mode.HANDY, description: 'Letter shifting, number substitution.' },
  { id: 'critical_reasoning', name: 'Critical Reasoning', mode: Mode.HANDY, description: 'Assumptions, Strengthening/Weakening arguments.' },
  { id: 'classification', name: 'Odd Man Out', mode: Mode.HANDY, description: 'Find the item that does not belong.' },
  { id: 'alpha_num', name: 'Alphabet/Number Test', mode: Mode.HANDY, description: 'Position of letters, series completion.' },
  { id: 'visual_series', name: 'Abstract Reasoning (Series)', mode: Mode.HANDY, description: 'Visual pattern completion.' },
  { id: 'direction_sense', name: 'Direction Sense (Simple)', mode: Mode.HANDY, description: 'Basic navigation logic.' },

  // Pen & Paper Mode Topics (Complex)
  { id: 'arrangement_linear', name: 'Linear Arrangement', mode: Mode.PEN_PAPER, description: 'Arranging people/items in a row with constraints.' },
  { id: 'arrangement_circular', name: 'Circular Arrangement', mode: Mode.PEN_PAPER, description: 'Seating arrangements around a table.' },
  { id: 'puzzle_test', name: 'Puzzle Test', mode: Mode.PEN_PAPER, description: 'Complex multi-variable matching (Day, Person, Item).' },
  { id: 'input_output', name: 'Input-Output', mode: Mode.PEN_PAPER, description: 'Machine sequential processing logic.' },
  { id: 'data_sufficiency', name: 'Data Sufficiency', mode: Mode.PEN_PAPER, description: 'Determine if data is sufficient to answer.' },
  { id: 'coding_sentence', name: 'Sentence Coding', mode: Mode.PEN_PAPER, description: 'Decoding patterns across multiple sentences.' },
  { id: 'blood_relations', name: 'Blood Relations (Complex)', mode: Mode.PEN_PAPER, description: 'Family tree structures.' },
];

export const RANK_TILES = [
  { threshold: 0, name: "Space Cadet", color: "text-gray-400" },
  { threshold: 20, name: "Star Navigator", color: "text-blue-400" },
  { threshold: 50, name: "Nebula Walker", color: "text-purple-400" },
  { threshold: 100, name: "Cosmic Master", color: "text-yellow-400" },
  { threshold: 200, name: "Galactic Deity", color: "text-red-500" },
];