import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";
import { IconClose, IconDots } from "./icons";

export function Dialog({
  title,
  children,
  onClose,
  width = "md",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  width?: "sm" | "md";
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return createPortal(
    <div className="anim-fade fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1c1b19]/35" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "anim-rise relative w-full rounded-2xl border border-line bg-cream p-5 shadow-[0_24px_60px_-28px_rgba(28,27,25,0.55)]",
          width === "sm" ? "max-w-sm" : "max-w-md",
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-serif text-[22px] leading-tight text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-mute transition hover:bg-paper-2 hover:text-ink"
            aria-label="Close"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  const id = useId();
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-mute">
        {label}
      </span>
      <div id={id}>{children}</div>
      {error ? <p className="mt-1.5 text-[13px] text-danger">{error}</p> : null}
    </label>
  );
}

export function TextInput({
  autoFocus,
  value,
  onChange,
  placeholder,
  onKeyDown,
  id,
}: {
  autoFocus?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onKeyDown?: (e: ReactKeyboardEvent<HTMLInputElement>) => void;
  id?: string;
}) {
  return (
    <input
      id={id}
      autoFocus={autoFocus}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      className="h-10 w-full rounded-xl border border-line bg-cream px-3 text-[14px] text-ink outline-none transition placeholder:text-mute/70 focus:border-ink"
    />
  );
}

export function Btn({
  children,
  onClick,
  variant = "ghost",
  type = "button",
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "ghost" | "solid" | "danger" | "quiet";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3.5 text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40",
        variant === "solid" && "bg-ink text-cream hover:bg-ink-soft",
        variant === "danger" && "bg-danger text-cream hover:bg-[#7a3224]",
        variant === "ghost" && "border border-line bg-cream text-ink hover:border-line-strong hover:bg-paper",
        variant === "quiet" && "text-mute hover:bg-paper-2 hover:text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}

export type MenuItem = {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
};

export function IconMenu({ items, label }: { items: MenuItem[]; label: string }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    const btn = btnRef.current;
    if (btn) {
      const r = btn.getBoundingClientRect();
      const width = 188;
      const left = Math.min(Math.max(8, r.right - width), window.innerWidth - width - 8);
      const top = r.bottom + 6;
      setPos({ top, left });
    }
    const onDoc = (e: PointerEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "rounded-lg p-1 text-mute transition hover:bg-paper-2 hover:text-ink",
          open && "bg-paper-2 text-ink",
        )}
      >
        <IconDots className="h-4 w-4" />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              className="anim-rise fixed z-50 min-w-[188px] rounded-xl border border-line bg-cream p-1 shadow-[0_16px_40px_-24px_rgba(28,27,25,0.55)]"
              style={{ top: pos.top, left: pos.left }}
            >
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.disabled) return;
                    setOpen(false);
                    item.onClick();
                  }}
                  className={cn(
                    "flex w-full rounded-lg px-3 py-2 text-left text-[13px] transition",
                    item.danger ? "text-danger hover:bg-danger-soft" : "text-ink hover:bg-paper",
                    item.disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel = "Delete",
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog title={title} onClose={onCancel} width="sm">
      <p className="text-[14px] leading-relaxed text-ink-soft">{body}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onCancel}>
          Cancel
        </Btn>
        <Btn variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Btn>
      </div>
    </Dialog>
  );
}

export function InlineRename({
  value,
  onSubmit,
  onCancel,
  className,
}: {
  value: string;
  onSubmit: (next: string) => void;
  onCancel: () => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  return (
    <input
      ref={ref}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const next = draft.trim();
        if (!next || next === value) onCancel();
        else onSubmit(next);
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
          e.preventDefault();
          const next = draft.trim();
          if (!next) onCancel();
          else onSubmit(next);
        }
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "h-7 w-full rounded-md border border-ink bg-cream px-1.5 text-[13px] text-ink outline-none",
        className,
      )}
    />
  );
}
