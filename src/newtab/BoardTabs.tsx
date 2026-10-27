import { useState } from "react";
import { cn } from "@/utils/cn";
import type { Board } from "@/storage/types";
import { IconPlus } from "./icons";
import { IconMenu, InlineRename } from "./ui";

export function BoardTabs({
  boards,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: {
  boards: Board[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const onlyOne = boards.length <= 1;

  return (
    <div className="flex min-w-0 items-end gap-1">
      <div className="scroll-thin flex min-w-0 flex-1 items-end gap-0.5 overflow-x-auto">
        {boards.map((board, index) => {
          const active = board.id === activeId;
          return (
            <div
              key={board.id}
              className={cn(
                "group relative flex shrink-0 items-center gap-0.5 border-b-2 px-1 pb-2",
                active ? "border-ink" : "border-transparent",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(board.id)}
                onDoubleClick={() => setRenamingId(board.id)}
                className={cn(
                  "max-w-[180px] truncate px-2 py-1 text-[13.5px] transition",
                  active ? "font-medium text-ink" : "text-mute hover:text-ink",
                )}
              >
                {renamingId === board.id ? (
                  <InlineRename
                    value={board.name}
                    onSubmit={(name) => {
                      onRename(board.id, name);
                      setRenamingId(null);
                    }}
                    onCancel={() => setRenamingId(null)}
                    className="w-36"
                  />
                ) : (
                  <>
                    <span className="mr-1.5 hidden text-[11px] text-mute sm:inline">
                      {index < 9 ? index + 1 : ""}
                    </span>
                    {board.name}
                  </>
                )}
              </button>
              {renamingId === board.id ? null : (
                <div className="opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                  <IconMenu
                    label={`Board menu for ${board.name}`}
                    items={[
                      { label: "Rename", onClick: () => setRenamingId(board.id) },
                      {
                        label: "Delete",
                        danger: true,
                        disabled: onlyOne,
                        onClick: () => onDelete(board.id),
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={onCreate}
          className="mb-2 ml-1 flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-[13px] text-mute transition hover:bg-paper-2 hover:text-ink"
        >
          <IconPlus className="h-3.5 w-3.5" />
          Board
        </button>
      </div>
    </div>
  );
}
