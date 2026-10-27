import { useState } from "react";
import type { Board, Card } from "@/storage/types";
import { findDuplicateInWorkspace, normalizeUrl, type AppDocument } from "@/storage";
import { Btn, Dialog, Field, TextInput } from "./ui";

export function NameDialog({
  title,
  label,
  initial = "",
  confirmLabel,
  onClose,
  onSubmit,
}: {
  title: string;
  label: string;
  initial?: string;
  confirmLabel: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(initial);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <Dialog title={title} onClose={onClose} width="sm">
      <Field label={label}>
        <TextInput
          autoFocus
          value={name}
          onChange={setName}
          placeholder="Name"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
      </Field>
      <div className="mt-5 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose}>
          Cancel
        </Btn>
        <Btn variant="solid" onClick={submit} disabled={!name.trim()}>
          {confirmLabel}
        </Btn>
      </div>
    </Dialog>
  );
}

export function SiteFormDialog({
  mode,
  doc,
  workspaceId,
  card,
  onClose,
  onCreate,
  onUpdate,
}: {
  mode: "create" | "edit";
  doc: AppDocument;
  workspaceId: string;
  card?: Card;
  onClose: () => void;
  onCreate: (input: { title: string; url: string; domain: string }) => void;
  onUpdate: (id: string, input: { title: string; url: string; domain: string }) => void;
}) {
  const [title, setTitle] = useState(card?.title ?? "");
  const [url, setUrl] = useState(card?.url ?? "");
  const [error, setError] = useState("");
  const [duplicateBoard, setDuplicateBoard] = useState<string | null>(null);
  const [pending, setPending] = useState<{ title: string; url: string; domain: string } | null>(
    null,
  );

  const apply = (input: { title: string; url: string; domain: string }) => {
    if (mode === "edit" && card) onUpdate(card.id, input);
    else onCreate(input);
  };

  const submit = (ignoreDuplicate = false) => {
    const result = normalizeUrl(url);
    if (!result.ok) {
      setError(result.error);
      setDuplicateBoard(null);
      setPending(null);
      return;
    }
    setError("");
    const input = {
      title: title.trim() || result.domain,
      url: result.url,
      domain: result.domain,
    };
    if (!ignoreDuplicate) {
      const dup = findDuplicateInWorkspace(
        doc,
        workspaceId,
        result.url,
        mode === "edit" ? card?.id : undefined,
      );
      if (dup) {
        setDuplicateBoard(dup.board.name);
        setPending(input);
        return;
      }
    }
    apply(input);
  };

  return (
    <Dialog title={mode === "edit" ? "Edit site" : "Add site"} onClose={onClose}>
      {duplicateBoard && pending ? (
        <div>
          <p className="text-[14px] leading-relaxed text-ink-soft">
            This URL already exists in board <span className="font-medium text-ink">{duplicateBoard}</span>.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Btn
              variant="ghost"
              onClick={() => {
                setDuplicateBoard(null);
                setPending(null);
              }}
            >
              Cancel
            </Btn>
            <Btn variant="solid" onClick={() => submit(true)}>
              Add anyway
            </Btn>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(false);
          }}
          className="space-y-3.5"
        >
          <Field label="Title">
            <TextInput autoFocus value={title} onChange={setTitle} placeholder="Friendly name" />
          </Field>
          <Field label="URL" error={error}>
            <TextInput
              value={url}
              onChange={(v) => {
                setUrl(v);
                setError("");
              }}
              placeholder="example.com"
            />
          </Field>
          <p className="text-[12px] text-mute">
            Saved to the current board. Missing https:// is added for you.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="ghost" onClick={onClose}>
              Cancel
            </Btn>
            <Btn variant="solid" type="submit">
              {mode === "edit" ? "Save" : "Add site"}
            </Btn>
          </div>
        </form>
      )}
    </Dialog>
  );
}

export function MoveCardDialog({
  card,
  boards,
  onClose,
  onMove,
}: {
  card: Card;
  boards: Board[];
  onClose: () => void;
  onMove: (boardId: string) => void;
}) {
  const others = boards.filter((b) => b.id !== card.boardId);

  return (
    <Dialog title="Move to board" onClose={onClose} width="sm">
      {others.length === 0 ? (
        <p className="text-[14px] text-ink-soft">There are no other boards in this workspace yet.</p>
      ) : (
        <ul className="space-y-1">
          {others.map((board) => (
            <li key={board.id}>
              <button
                type="button"
                onClick={() => onMove(board.id)}
                className="flex h-10 w-full items-center rounded-xl px-3 text-left text-[14px] text-ink transition hover:bg-paper"
              >
                {board.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex justify-end">
        <Btn variant="ghost" onClick={onClose}>
          Cancel
        </Btn>
      </div>
    </Dialog>
  );
}
