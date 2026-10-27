/**
 * The ONLY module that reads or writes persisted state.
 * UI code must go through these functions — never localStorage / chrome.storage directly.
 *
 * Backend: localStorage for instant first paint (and for the web preview).
 * When running as a Chrome extension, the same document is also mirrored to
 * chrome.storage.local so the NTP override and a future service worker share state.
 */

import { createId, nextOrder, nowIso } from "./ids";
import { canonicalUrl } from "./url";
import {
  SCHEMA_VERSION,
  STORAGE_KEY,
  type AppDocument,
  type Board,
  type Card,
  type Settings,
  type Workspace,
} from "./types";

export type { AppDocument, Board, Card, Workspace } from "./types";
export { normalizeUrl, canonicalUrl } from "./url";
export type { UrlResult } from "./url";

type Listener = () => void;

const listeners = new Set<Listener>();

function emptyDocument(): AppDocument {
  return {
    schemaVersion: SCHEMA_VERSION,
    workspaces: [],
    boards: [],
    cards: [],
    tasks: [],
    planner: [],
    journal: [],
    settings: defaultSettings(),
    meta: {
      lastActiveWorkspaceId: "",
      lastActiveBoardId: "",
      lastPage: 1,
      firstRunDone: false,
    },
  };
}

function defaultSettings(): Settings {
  return {
    userName: "",
    theme: "system",
    clockStyle: "digital",
    wallpaper: "gradient-1",
    widgets: ["clock", "greeting", "pinned"],
    gridDensity: "comfortable",
    pomodoro: { focus: 25, break: 5 },
    focusMode: { blockedSites: [] },
    syncLinked: false,
  };
}

function coerce(raw: unknown): AppDocument {
  const base = emptyDocument();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<AppDocument>;
  return {
    schemaVersion: typeof r.schemaVersion === "number" ? r.schemaVersion : SCHEMA_VERSION,
    workspaces: Array.isArray(r.workspaces) ? r.workspaces : [],
    boards: Array.isArray(r.boards) ? r.boards : [],
    cards: Array.isArray(r.cards) ? r.cards : [],
    tasks: Array.isArray(r.tasks) ? r.tasks : [],
    planner: Array.isArray(r.planner) ? r.planner : [],
    journal: Array.isArray(r.journal) ? r.journal : [],
    settings: { ...base.settings, ...(r.settings ?? {}) },
    meta: { ...base.meta, ...(r.meta ?? {}) },
  };
}

function seedFirstRun(doc: AppDocument): AppDocument {
  if (doc.workspaces.length > 0) return doc;
  const ts = nowIso();
  const workspaceId = createId();
  const boardId = createId();
  doc.workspaces.push({
    id: workspaceId,
    name: "Personal",
    order: 0,
    createdAt: ts,
  });
  doc.boards.push({
    id: boardId,
    workspaceId,
    name: "Quick Links",
    order: 0,
    createdAt: ts,
  });
  doc.meta.lastActiveWorkspaceId = workspaceId;
  doc.meta.lastActiveBoardId = boardId;
  return doc;
}

function readRaw(): unknown | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function persist(doc: AppDocument): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  } catch {
    // Quota or private-mode edge case — keep working from memory.
  }
  const chromeStorage = (
    globalThis as unknown as {
      chrome?: { storage?: { local?: { set?: (items: Record<string, unknown>) => void } } };
    }
  ).chrome?.storage?.local;
  if (chromeStorage?.set) {
    try {
      chromeStorage.set({ [STORAGE_KEY]: doc });
    } catch {
      // Web preview has no chrome API.
    }
  }
}

function emit(): void {
  listeners.forEach((fn) => fn());
}

function copy(): AppDocument {
  return structuredClone(cache);
}

function commit(doc: AppDocument): void {
  cache = doc;
  persist(doc);
  emit();
}

let cache: AppDocument = seedFirstRun(coerce(readRaw()));
persist(cache);

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): AppDocument {
  return cache;
}

/* ── selectors (pure, no I/O) ── */

export function sortedWorkspaces(doc: AppDocument): Workspace[] {
  return [...doc.workspaces].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

export function boardsForWorkspace(doc: AppDocument, workspaceId: string): Board[] {
  return doc.boards
    .filter((b) => b.workspaceId === workspaceId)
    .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

export function cardsForBoard(doc: AppDocument, boardId: string): Card[] {
  return doc.cards
    .filter((c) => c.boardId === boardId)
    .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

export function activeWorkspace(doc: AppDocument): Workspace | undefined {
  return (
    doc.workspaces.find((w) => w.id === doc.meta.lastActiveWorkspaceId) ??
    sortedWorkspaces(doc)[0]
  );
}

export function activeBoard(doc: AppDocument): Board | undefined {
  const ws = activeWorkspace(doc);
  if (!ws) return undefined;
  const boards = boardsForWorkspace(doc, ws.id);
  return boards.find((b) => b.id === doc.meta.lastActiveBoardId) ?? boards[0];
}

export function workspaceStats(
  doc: AppDocument,
  workspaceId: string,
): { boardCount: number; cardCount: number } {
  const boards = doc.boards.filter((b) => b.workspaceId === workspaceId);
  const ids = new Set(boards.map((b) => b.id));
  return {
    boardCount: boards.length,
    cardCount: doc.cards.filter((c) => ids.has(c.boardId)).length,
  };
}

export function boardCardCount(doc: AppDocument, boardId: string): number {
  return doc.cards.filter((c) => c.boardId === boardId).length;
}

export function findDuplicateInWorkspace(
  doc: AppDocument,
  workspaceId: string,
  url: string,
  excludeCardId?: string,
): { card: Card; board: Board } | null {
  const needle = canonicalUrl(url);
  const boardIds = new Set(
    doc.boards.filter((b) => b.workspaceId === workspaceId).map((b) => b.id),
  );
  const card = doc.cards.find(
    (c) =>
      boardIds.has(c.boardId) &&
      c.id !== excludeCardId &&
      canonicalUrl(c.url) === needle,
  );
  if (!card) return null;
  const board = doc.boards.find((b) => b.id === card.boardId);
  if (!board) return null;
  return { card, board };
}

/* ── mutations ── */

export function setActiveWorkspace(workspaceId: string): void {
  const doc = copy();
  const ws = doc.workspaces.find((w) => w.id === workspaceId);
  if (!ws) return;
  doc.meta.lastActiveWorkspaceId = workspaceId;
  const boards = boardsForWorkspace(doc, workspaceId);
  if (!boards.some((b) => b.id === doc.meta.lastActiveBoardId)) {
    doc.meta.lastActiveBoardId = boards[0]?.id ?? "";
  }
  commit(doc);
}

export function setActiveBoard(boardId: string): void {
  const doc = copy();
  const board = doc.boards.find((b) => b.id === boardId);
  if (!board) return;
  doc.meta.lastActiveBoardId = boardId;
  doc.meta.lastActiveWorkspaceId = board.workspaceId;
  commit(doc);
}

export function createWorkspace(name: string): { workspace: Workspace; board: Board } {
  const doc = copy();
  const ts = nowIso();
  const workspace: Workspace = {
    id: createId(),
    name: name.trim() || "Untitled",
    order: nextOrder(doc.workspaces),
    createdAt: ts,
  };
  const board: Board = {
    id: createId(),
    workspaceId: workspace.id,
    name: "Quick Links",
    order: 0,
    createdAt: ts,
  };
  doc.workspaces.push(workspace);
  doc.boards.push(board);
  doc.meta.lastActiveWorkspaceId = workspace.id;
  doc.meta.lastActiveBoardId = board.id;
  commit(doc);
  return { workspace, board };
}

export function renameWorkspace(id: string, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const doc = copy();
  const ws = doc.workspaces.find((w) => w.id === id);
  if (!ws) return;
  ws.name = trimmed;
  commit(doc);
}

export function deleteWorkspace(
  id: string,
): { ok: true } | { ok: false; reason: string } {
  const doc = copy();
  if (doc.workspaces.length <= 1) {
    return { ok: false, reason: "At least one workspace is required." };
  }
  const remaining = doc.workspaces.filter((w) => w.id !== id);
  const removedBoards = doc.boards.filter((b) => b.workspaceId === id);
  const removedIds = new Set(removedBoards.map((b) => b.id));
  doc.workspaces = remaining;
  doc.boards = doc.boards.filter((b) => b.workspaceId !== id);
  doc.cards = doc.cards.filter((c) => !removedIds.has(c.boardId));
  if (doc.meta.lastActiveWorkspaceId === id) {
    const next = [...remaining].sort((a, b) => a.order - b.order)[0];
    doc.meta.lastActiveWorkspaceId = next?.id ?? "";
    const nextBoards = boardsForWorkspace(doc, doc.meta.lastActiveWorkspaceId);
    doc.meta.lastActiveBoardId = nextBoards[0]?.id ?? "";
  }
  commit(doc);
  return { ok: true };
}

export function createBoard(workspaceId: string, name: string): Board | null {
  const doc = copy();
  if (!doc.workspaces.some((w) => w.id === workspaceId)) return null;
  const siblings = doc.boards.filter((b) => b.workspaceId === workspaceId);
  const board: Board = {
    id: createId(),
    workspaceId,
    name: name.trim() || "Untitled",
    order: nextOrder(siblings),
    createdAt: nowIso(),
  };
  doc.boards.push(board);
  doc.meta.lastActiveBoardId = board.id;
  doc.meta.lastActiveWorkspaceId = workspaceId;
  commit(doc);
  return board;
}

export function renameBoard(id: string, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const doc = copy();
  const board = doc.boards.find((b) => b.id === id);
  if (!board) return;
  board.name = trimmed;
  commit(doc);
}

export function deleteBoard(
  id: string,
): { ok: true } | { ok: false; reason: string } {
  const doc = copy();
  const board = doc.boards.find((b) => b.id === id);
  if (!board) return { ok: false, reason: "Board not found." };
  const siblings = doc.boards.filter((b) => b.workspaceId === board.workspaceId);
  if (siblings.length <= 1) {
    return { ok: false, reason: "A workspace is never empty — keep at least one board." };
  }
  doc.boards = doc.boards.filter((b) => b.id !== id);
  doc.cards = doc.cards.filter((c) => c.boardId !== id);
  if (doc.meta.lastActiveBoardId === id) {
    const next = boardsForWorkspace(doc, board.workspaceId).find((b) => b.id !== id);
    doc.meta.lastActiveBoardId = next?.id ?? "";
  }
  commit(doc);
  return { ok: true };
}

export function createCard(
  boardId: string,
  input: { title: string; url: string; domain: string },
): Card | null {
  const doc = copy();
  if (!doc.boards.some((b) => b.id === boardId)) return null;
  const siblings = doc.cards.filter((c) => c.boardId === boardId);
  const ts = nowIso();
  const title = input.title.trim() || input.domain;
  const card: Card = {
    id: createId(),
    boardId,
    title,
    url: input.url,
    domain: input.domain,
    order: nextOrder(siblings),
    favorite: false,
    note: "",
    description: "",
    favicon: "",
    createdAt: ts,
    updatedAt: ts,
  };
  doc.cards.push(card);
  commit(doc);
  return card;
}

export function updateCard(
  id: string,
  patch: { title: string; url: string; domain: string },
): void {
  const doc = copy();
  const card = doc.cards.find((c) => c.id === id);
  if (!card) return;
  card.title = patch.title.trim() || patch.domain;
  card.url = patch.url;
  card.domain = patch.domain;
  card.updatedAt = nowIso();
  commit(doc);
}

export function moveCard(id: string, targetBoardId: string): void {
  const doc = copy();
  const card = doc.cards.find((c) => c.id === id);
  if (!card) return;
  if (!doc.boards.some((b) => b.id === targetBoardId)) return;
  if (card.boardId === targetBoardId) return;
  const siblings = doc.cards.filter((c) => c.boardId === targetBoardId);
  card.boardId = targetBoardId;
  card.order = nextOrder(siblings);
  card.updatedAt = nowIso();
  commit(doc);
}

export function deleteCard(id: string): void {
  const doc = copy();
  doc.cards = doc.cards.filter((c) => c.id !== id);
  commit(doc);
}
