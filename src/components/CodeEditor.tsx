import styles from './CodeEditor.module.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Simple textarea-based code editor.
 *
 * Monaco Editor integration is deferred to a future phase after bundle size
 * and accessibility checks. This textarea provides functional code editing
 * without external dependencies.
 */
export function CodeEditor({ value, onChange, disabled = false }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.lang}>JavaScript</span>
        <span className={styles.note}>
          Edit the code below, then click Run Tests to verify your fix.
        </span>
      </div>
      <textarea
        className={styles.editor}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-label="Code editor"
        rows={20}
      />
    </div>
  );
}
