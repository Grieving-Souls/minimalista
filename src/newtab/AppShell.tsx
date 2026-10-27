import { useCallback, useEffect, useMemo, useState } from "react";
import { useSyncExternalStore } from "react";
import {
  activeBoard,
  activeWorkspace,
  boardCardCount,
  boardsForWorkspace,
  cardsForBoard,
  createBoard,
  createCard,
  createWorkspace,
  deleteBoard,
  deleteCard,
  deleteWorkspace,
  getSnapshot,
  moveCard,
  renameBoard,
  renameWorkspace,
  setActiveBoard,
  setActiveWorkspace,
  sortedWorkspaces,
  subscribe,
  updateCard,
  workspaceStats,
} from "@/storage";
import type { Card } from "@/storage/types";
import { BoardTabs } from "./BoardTabs";
import { CardGrid } from "./CardGrid";
import { MoveCardDialog, NameDialog, SiteFormDialog } from "./dialogs";
import { IconPlus, Mark } from "./icons";
import { Sidebar } from "./Sidebar";
import { ConfirmDialog } from "./ui";

type DialogState =
  | { type: "add-site" }
  | { type: "edit-site"; card: Card }
  | { type: "move-card"; card: Card }
  | { type: "new-workspace" }
  | { type: "new-board" }
  | { type: "delete-workspace"; id: string }
  | { type: "delete-board"; id: string }
  | { type: "delete-card"; card: Card }
  | null;

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function gridColumnCount(): number {
  const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-card-id]"));
  if (cards.length < 2) return 1;
  const top = cards[0].offsetTop;
  let cols = 1;
  for (let i = 1; i < cards.length; i++) {
    if (cards[i].offsetTop !== top) break;
    cols += 1;
  }
  return Math.max(1, cols);
}

function openInNewTab(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function AppShell() {
  const doc = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const workspaces = useMemo(() => sortedWorkspaces(doc), [doc]);
  const workspace = activeWorkspace(doc);
  const boards = useMemo(
    () => (workspace ? boardsForWorkspace(doc, workspace.id) : []),
    [doc, workspace],
  );
  const board = activeBoard(doc);
  const cards = useMemo(
    () => (board ? cardsForBoard(doc, board.id) : []),
    [doc, board],
  );

  const closeDialog = useCallback(() => setDialog(null), []);

  useEffect(() => {
    if (selectedId && !cards.some((c) => c.id === selectedId)) {
      setSelectedId(null);
    }
  }, [cards, selectedId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (dialog) return;
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key >= "1" && e.key <= "9") {
        const index = Number(e.key) - 1;
        const target = boards[index];
        if (target) {
          e.preventDefault();
          setActiveBoard(target.id);
          setSelectedId(null);
        }
        return;
      }

      if (e.key === "Escape") {
        setSelectedId(null);
        return;
      }

      const ids = cards.map((c) => c.id);
      if (ids.length === 0) return;

      if (e.key === "Enter") {
        const card = cards.find((c) => c.id === selectedId);
        if (card) {
          e.preventDefault();
          openInNewTab(card.url);
        }
        return;
      }

      const cols = gridColumnCount();
      let index = selectedId ? ids.indexOf(selectedId) : -1;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        index = index < 0 ? 0 : Math.min(ids.length - 1, index + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        index = index < 0 ? 0 : Math.max(0, index - 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        index = index < 0 ? 0 : Math.min(ids.length - 1, index + cols);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        index = index < 0 ? 0 : Math.max(0, index - cols);
      } else {
        return;
      }
      setSelectedId(ids[index] ?? null);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, boards, cards, selectedId]);

  if (!workspace || !board) {
    return (
      <div className="flex min-h-screen items-center justify-center text-mute">
        Loading…
      </div>
    );
  }

  const deleteWorkspaceTarget = dialog?.type === "delete-workspace"
    ? workspaces.find((w) => w.id === dialog.id)
    : undefined;
  const deleteWorkspaceCounts = deleteWorkspaceTarget
    ? workspaceStats(doc, deleteWorkspaceTarget.id)
    : null;

  const deleteBoardTarget = dialog?.type === "delete-board"
    ? boards.find((b) => b.id === dialog.id)
    : undefined;
  const deleteBoardCount = deleteBoardTarget ? boardCardCount(doc, deleteBoardTarget.id) : 0;

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-paper text-ink">
      <div className="grain" />
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
        <div className="flex items-center gap-2.5">
          <Mark className="h-7 w-7 text-ink" />
          <span className="font-serif text-[20px] tracking-tight">Minimalista</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-mute">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" />
          Local Only
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar
          workspaces={workspaces}
          activeId={workspace.id}
          onSelect={(id) => {
            setActiveWorkspace(id);
            setSelectedId(null);
          }}
          onCreate={() => setDialog({ type: "new-workspace" })}
          onRename={renameWorkspace}
          onDelete={(id) => setDialog({ type: "delete-workspace", id })}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-end justify-between gap-3 border-b border-line px-4 pt-3">
            <BoardTabs
              boards={boards}
              activeId={board.id}
              onSelect={(id) => {
                setActiveBoard(id);
                setSelectedId(null);
              }}
              onCreate={() => setDialog({ type: "new-board" })}
              onRename={renameBoard}
              onDelete={(id) => setDialog({ type: "delete-board", id })}
            />
            <button
              type="button"
              onClick={() => setDialog({ type: "add-site" })}
              className="mb-2 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-ink px-3 text-[13px] font-medium text-cream transition hover:bg-ink-soft"
            >
              <IconPlus className="h-3.5 w-3.5" />
              Add Site
            </button>
          </div>

          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
            <CardGrid
              cards={cards}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onOpen={(card) => openInNewTab(card.url)}
              onEdit={(card) => setDialog({ type: "edit-site", card })}
              onMove={(card) => setDialog({ type: "move-card", card })}
              onDelete={(card) => setDialog({ type: "delete-card", card })}
              onAdd={() => setDialog({ type: "add-site" })}
            />
          </div>
        </main>
      </div>

      {dialog?.type === "add-site" ? (
        <SiteFormDialog
          mode="create"
          doc={doc}
          workspaceId={workspace.id}
          onClose={closeDialog}
          onCreate={(input) => {
            createCard(board.id, input);
            closeDialog();
          }}
          onUpdate={() => undefined}
        />
      ) : null}

      {dialog?.type === "edit-site" ? (
        <SiteFormDialog
          mode="edit"
          doc={doc}
          workspaceId={workspace.id}
          card={dialog.card}
          onClose={closeDialog}
          onCreate={() => undefined}
          onUpdate={(id, input) => {
            updateCard(id, input);
            closeDialog();
          }}
        />
      ) : null}

      {dialog?.type === "move-card" ? (
        <MoveCardDialog
          card={dialog.card}
          boards={boards}
          onClose={closeDialog}
          onMove={(boardId) => {
            moveCard(dialog.card.id, boardId);
            closeDialog();
          }}
        />
      ) : null}

      {dialog?.type === "new-workspace" ? (
        <NameDialog
          title="New workspace"
          label="Name"
          confirmLabel="Create"
          onClose={closeDialog}
          onSubmit={(name) => {
            createWorkspace(name);
            setSelectedId(null);
            closeDialog();
          }}
        />
      ) : null}

      {dialog?.type === "new-board" ? (
        <NameDialog
          title="New board"
          label="Name"
          confirmLabel="Create"
          onClose={closeDialog}
          onSubmit={(name) => {
            createBoard(workspace.id, name);
            setSelectedId(null);
            closeDialog();
          }}
        />
      ) : null}

      {dialog?.type === "delete-workspace" && deleteWorkspaceTarget && deleteWorkspaceCounts ? (
        <ConfirmDialog
          title={`Delete workspace “${deleteWorkspaceTarget.name}”?`}
          body={`This will permanently delete ${deleteWorkspaceCounts.boardCount} ${
            deleteWorkspaceCounts.boardCount === 1 ? "board" : "boards"
          } and ${deleteWorkspaceCounts.cardCount} ${
            deleteWorkspaceCounts.cardCount === 1 ? "card" : "cards"
          }.`}
          onCancel={closeDialog}
          onConfirm={() => {
            deleteWorkspace(deleteWorkspaceTarget.id);
            setSelectedId(null);
            closeDialog();
          }}
        />
      ) : null}

      {dialog?.type === "delete-board" && deleteBoardTarget ? (
        <ConfirmDialog
          title={`Delete board “${deleteBoardTarget.name}”?`}
          body={`This will permanently delete ${deleteBoardCount} ${
            deleteBoardCount === 1 ? "card" : "cards"
          }.`}
          onCancel={closeDialog}
          onConfirm={() => {
            deleteBoard(deleteBoardTarget.id);
            setSelectedId(null);
            closeDialog();
          }}
        />
      ) : null}

      {dialog?.type === "delete-card" ? (
        <ConfirmDialog
          title={`Delete “${dialog.card.title}”?`}
          body="This card will be removed from the board."
          onCancel={closeDialog}
          onConfirm={() => {
            deleteCard(dialog.card.id);
            closeDialog();
          }}
        />
      ) : null}
    </div>
  );
}
