"use client";

import { useEffect } from "react";

import { Icons } from "@/components/icons";

/**
 * Lightweight, dependency-free modal. Renders nothing when closed so the form
 * inside remounts (and resets) on every open. Closes on backdrop click, the X
 * button, and Escape; locks body scroll while open.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 bg-black/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 my-4 w-full max-w-3xl rounded-xl border border-border bg-background shadow-xl sm:my-8"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-medium">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground"
          >
            <Icons.close />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-5 pt-5 pb-3">{children}</div>
      </div>
    </div>
  );
}
