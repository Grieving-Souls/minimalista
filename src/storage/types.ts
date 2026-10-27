/** Full Minimalista document schema (v1). Later phases use these fields; Phase 1 initializes defaults. */

export type Theme = "light" | "dark" | "system";
export type ClockStyle = "digital" | "flip" | "analog";
export type GridDensity = "comfortable" | "compact";

export interface Workspace {
  id: string;
  name: string;
  order: number;
  createdAt: string;
}

export interface Board {
  id: string;
  workspaceId: string;
  name: string;
  order: number;
  createdAt: string;
}

export interface Card {
  id: string;
  boardId: string;
  title: string;
  url: string;
  domain: string;
  order: number;
  favorite: boolean;
  note: string;
  description: string;
  favicon: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  priority: 1 | 2 | 3;
  completed: boolean;
  subtasks: Subtask[];
  createdAt: string;
  completedAt: string | null;
}

export interface PlannerEntry {
  id: string;
  date: string;
  title: string;
  isDeadline: boolean;
}

export interface JournalEntry {
  date: string;
  text: string;
}

export interface Settings {
  userName: string;
  theme: Theme;
  clockStyle: ClockStyle;
  wallpaper: string;
  widgets: string[];
  gridDensity: GridDensity;
  pomodoro: { focus: number; break: number };
  focusMode: { blockedSites: string[] };
  syncLinked: boolean;
}

export interface Meta {
  lastActiveWorkspaceId: string;
  lastActiveBoardId: string;
  lastPage: 1 | 2;
  firstRunDone: boolean;
}

export interface AppDocument {
  schemaVersion: number;
  workspaces: Workspace[];
  boards: Board[];
  cards: Card[];
  tasks: Task[];
  planner: PlannerEntry[];
  journal: JournalEntry[];
  settings: Settings;
  meta: Meta;
}

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = "minimalista:data";
