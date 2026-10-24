import { cloneElement, useEffect, useId, useState } from 'react';
import type { ReactElement } from 'react';
import styles from './Tooltip.module.css';

type Placement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  /** Short explanation shown in the tooltip. */
  label: string;
  /** A single focusable element, e.g. a <button> or <select>. */
  children: ReactElement<{ 'aria-describedby'?: string }>;
  /** Where the tooltip appears relative to the trigger. Defaults to 'top'. */
  placement?: Placement;
  /** Optional explicit id for the tooltip element. */
  id?: string;
}

/**
 * Accessible tooltip.
 * - Opens on hover and on keyboard focus.
 * - Closes on mouse leave, blur and Escape (Escape never moves focus).
 * - Events live on a wrapper, so the child's own handlers are never overwritten.
 * - Only aria-describedby is merged onto the child.
 */
export function Tooltip({ label, children, placement = 'top', id }: TooltipProps) {
  const generatedId = useId();
  const tipId = id ?? generatedId;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const open = (hovered || focused) && !dismissed;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDismissed(true);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const describedBy =
    [children.props['aria-describedby'], open ? tipId : undefined].filter(Boolean).join(' ') ||
    undefined;

  return (
    <span
      className={styles.wrapper}
      onMouseEnter={() => {
        setDismissed(false);
        setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => {
        setDismissed(false);
        setFocused(true);
      }}
      onBlur={() => setFocused(false)}
    >
      {cloneElement(children, { 'aria-describedby': describedBy })}
      {open && (
        <span
          role="tooltip"
          id={tipId}
          className={`${styles.tip} ${styles[placement]}`}
          data-placement={placement}
        >
          {label}
        </span>
      )}
    </span>
  );
}
