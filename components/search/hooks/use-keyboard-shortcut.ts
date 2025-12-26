"use client";

import { useEffect } from "react";

interface UseKeyboardShortcutOptions {
  key: string;
  callback: () => void;
  modifiers?: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
}

/**
 * Custom keyboard shortcut hook
 * Listens for keyboard events and triggers callback when shortcut is pressed
 */
export function useKeyboardShortcut({
  key,
  callback,
  modifiers = {},
}: UseKeyboardShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { ctrl, meta, shift, alt } = modifiers;

      const ctrlMatch = ctrl ? event.ctrlKey : true;
      const metaMatch = meta ? event.metaKey : true;
      const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
      const altMatch = alt ? event.altKey : !event.altKey;

      // For Ctrl+K or Cmd+K, we want either ctrl OR meta to be pressed
      const modifierMatch =
        ctrl || meta
          ? (event.ctrlKey || event.metaKey) && shiftMatch && altMatch
          : ctrlMatch && metaMatch && shiftMatch && altMatch;

      if (event.key.toLowerCase() === key.toLowerCase() && modifierMatch) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, callback, modifiers]);
}
