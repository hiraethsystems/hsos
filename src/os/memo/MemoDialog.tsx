/**
 * The HR memo dialog (SPEC 11.9): a small modal for jokes and system messages. Focus moves to
 * Acknowledge, stays inside the dialog, and returns where it was when the memo is closed.
 * Escape also acknowledges, under protest.
 */
import type { TargetedKeyboardEvent } from 'preact';
import { useEffect, useId, useRef } from 'preact/hooks';

export function MemoDialog({ text, onClose }: { text: string; onClose: () => void }) {
  const titleId = useId();
  const textId = useId();
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    button.current?.focus();
    return () => {
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);

  const onKey = (e: TargetedKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      button.current?.focus();
    }
  };

  return (
    <div class="hs-modal-layer" onKeyDown={onKey}>
      <div class="hs-memo" role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={textId}>
        <h2 id={titleId} class="hs-memo-title">
          Memo from HR
        </h2>
        <div class="hs-memo-body">
          <p id={textId}>{text}</p>
          <button ref={button} type="button" class="hs-btn" onClick={onClose}>
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
