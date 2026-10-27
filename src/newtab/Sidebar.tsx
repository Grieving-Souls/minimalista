import { useState } from "react";
import { cn } from "@/utils/cn";
import type { Workspace } from "@/storage/types";
import { IconPlus } from "./icons";
import { IconMenu, InlineRename } from "./ui";

export function Sidebar({
  workspaces,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: {
  workspaces: Workspace[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const onlyOne = workspaces.length <= 1;

  return (
    <aside className="flex w-[232px] shrink-0 flex-col border-r border-line bg-paper-2/70">
      <div className="px-4 pb-2 pt-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">
          Workspaces
        </p>
      </div>
      <nav className="scroll-thin flex-1 overflow-y-auto px-2 pb-2">
        {workspaces.map((ws) => {
          const active = ws.id === activeId;
          return (
            <div
              key={ws.id}
              className={cn(
                "group mb-0.5 flex items-center gap-1 rounded-xl pr-1 transition",
                active ? "bg-cream text-ink shadow-[inset_0_0_0_1px_var(--color-line)]" : "text-ink-soft hover:bg-cream/60",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(ws.id)}
                onDoubleClick={() => setRenamingId(ws.id)}
                className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2 text-left"
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    active ? "bg-accent" : "bg-line-strong",
                  )}
                />
                {renamingId === ws.id ? (
                  <InlineRename
                    value={ws.name}
                    onSubmit={(name) => {
                      onRename(ws.id, name);
                      setRenamingId(null);
                    }}
                    onCancel={() => setRenamingId(null)}
                  />
                ) : (
                  <span className={cn("truncate text-[13.5px]", active && "font-medium")}>
                    {ws.name}
                  </span>
                )}
              </button>
              {renamingId === ws.id ? null : (
                <div className="opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                  <IconMenu
                    label={`Workspace menu for ${ws.name}`}
                    items={[
                      { label: "Rename", onClick: () => setRenamingId(ws.id) },
                      {
                        label: "Delete",
                        danger: true,
                        disabled: onlyOne,
                        onClick: () => onDelete(ws.id),
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-line p-2">
        <button
          type="button"
          onClick={onCreate}
          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-[13px] text-ink-soft transition hover:bg-cream hover:text-ink"
        >
          <IconPlus className="h-3.5 w-3.5" />
          Workspace
        </button>
      </div>
    </aside>
  );
}
