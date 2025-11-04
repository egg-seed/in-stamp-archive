"use client";

import {
  cloneElement,
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

interface DialogContextValue {
  open: boolean;
  setOpen: (value: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

interface DialogProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Dialog({ children, open, onOpenChange }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const isControlled = typeof open === "boolean";
  const resolvedOpen = isControlled ? (open as boolean) : uncontrolledOpen;

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange],
  );

  const contextValue = useMemo<DialogContextValue>(
    () => ({ open: resolvedOpen, setOpen }),
    [resolvedOpen, setOpen],
  );

  return (
    <DialogContext.Provider value={contextValue}>{children}</DialogContext.Provider>
  );
}

function useDialogContext(component: string): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error(`${component} must be used within <Dialog>`);
  }
  return context;
}

interface DialogTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

export function DialogTrigger({ children, asChild }: DialogTriggerProps) {
  const { setOpen } = useDialogContext("DialogTrigger");

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (event?: unknown) => void }>;
    return cloneElement(child, {
      onClick: (event?: unknown) => {
        child.props.onClick?.(event);
        setOpen(true);
      },
    });
  }

  return (
    <button type="button" onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}

interface DialogPortalProps {
  children: ReactNode;
}

function DialogPortal({ children }: DialogPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(children, document.body);
}

interface DialogContentProps {
  children: ReactNode;
  className?: string;
}

export function DialogContent({ children, className }: DialogContentProps) {
  const { open, setOpen } = useDialogContext("DialogContent");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  if (!open) {
    return null;
  }

  return (
    <DialogPortal>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
        <div className={cn("w-full max-w-lg rounded-xl bg-background p-6 shadow-xl", className)}>
          {children}
        </div>
      </div>
    </DialogPortal>
  );
}

export function DialogHeader({ children }: { children: ReactNode }) {
  return <div className="space-y-1.5 text-center sm:text-left">{children}</div>;
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {children}
    </div>
  );
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-lg font-semibold leading-none tracking-tight">{children}</h3>;
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
