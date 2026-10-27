import { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";
import type { Card } from "@/storage/types";
import { avatarColor, avatarLetter } from "./avatar";
import { IconPlus } from "./icons";
import { IconMenu } from "./ui";

export function CardGrid({
  cards,
  selectedId,
  onSelect,
  onOpen,
  onEdit,
  onMove,
  onDelete,
  onAdd,
}: {
  cards: Card[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpen: (card: Card) => void;
  onEdit: (card: Card) => void;
  onMove: (card: Card) => void;
  onDelete: (card: Card) => void;
  onAdd: () => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedId) return;
    const el = gridRef.current?.querySelector(`[data-card-id="${selectedId}"]`);
    if (el instanceof HTMLElement) el.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  if (cards.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-line-strong text-mute">
            <EmptyMark />
          </div>
          <h3 className="font-serif text-[26px] leading-tight text-ink">Add your first site</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-mute">
            Cards live on this board. Open any of them in a new tab with one click.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="cta-pulse mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-[13.5px] font-medium text-cream"
          >
            <IconPlus className="h-4 w-4" />
            Add Site
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-[repeat(auto-fill,minmax(176px,1fr))] gap-3 p-5"
    >
      {cards.map((card) => {
        const selected = card.id === selectedId;
        const color = avatarColor(card.domain);
        return (
          <article
            key={card.id}
            data-card-id={card.id}
            tabIndex={-1}
            onClick={() => {
              onSelect(card.id);
              onOpen(card);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              onSelect(card.id);
            }}
            className={cn(
              "group relative flex cursor-pointer select-none flex-col gap-3 rounded-2xl border bg-cream p-4 transition duration-150",
              selected
                ? "border-ink ring-1 ring-ink"
                : "border-line hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_10px_24px_-18px_rgba(28,27,25,0.45)]",
            )}
          >
            <div className="flex items-start justify-between">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-semibold"
                style={{ background: color.bg, color: color.fg }}
              >
                {avatarLetter(card.domain)}
              </div>
              <div
                className={cn(
                  "transition",
                  selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <IconMenu
                  label={`Card menu for ${card.title}`}
                  items={[
                    { label: "Edit", onClick: () => onEdit(card) },
                    { label: "Move to board", onClick: () => onMove(card) },
                    { label: "Delete", danger: true, onClick: () => onDelete(card) },
                  ]}
                />
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[14.5px] font-medium text-ink">{card.title}</h3>
              <p className="mt-0.5 truncate text-[12px] text-mute">{card.domain}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function EmptyMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
      <path d="M8 10h8M8 14h5" />
    </svg>
  );
}
