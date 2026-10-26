import { ReactNode, useRef, useState } from 'react';
import styles from './ExpandablePanel.module.css';

type ExpandablePanelProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  id: string;
};

export function ExpandablePanel({ title, children, defaultOpen = true, id }: ExpandablePanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const summaryId = `${id}-summary`;
  const contentId = `${id}-content`;
  const toggle = () => setOpen((o) => !o);

  return (
    <section className={styles.panel}>
      <h2 className={styles.header}>
        <button
          id={summaryId}
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={toggle}
          className={styles.toggle}
        >
          <span className={styles.title}>{title}</span>
          <span aria-hidden="true" className={styles.chevron}>
            {open ? '▼' : '▶'}
          </span>
        </button>
      </h2>
      <div
        ref={contentRef}
        id={contentId}
        role="region"
        aria-labelledby={summaryId}
        className={[styles.content, open ? styles.open : styles.closed].filter(Boolean).join(' ')}
      >
        {children}
      </div>
    </section>
  );
}