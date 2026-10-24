import { useState } from 'react';
import {
  backwardChain,
  forwardChain,
  type InferenceResult,
  type Rule,
} from '../engine/inference';
import styles from './KnowledgeLab.module.css';

const INITIAL_FACTS = ['rain', 'cold'];
const EXAMPLE_GOAL = 'slippery';

const RULES: Rule[] = [
  {
    id: 'rain-wets-grass',
    premises: ['rain'],
    conclusion: 'wet-grass',
    description: 'Rain makes the grass wet.',
  },
  {
    id: 'cold-wet-grass-slippery',
    premises: ['wet-grass', 'cold'],
    conclusion: 'slippery',
    description: 'Wet grass is slippery when it is cold.',
  },
  {
    id: 'wet-grass-muddy',
    premises: ['wet-grass'],
    conclusion: 'muddy',
    description: 'Wet grass makes the ground muddy.',
  },
];

type ChainingMode = 'forward' | 'backward';

function describeGoalStatus(result: InferenceResult): string {
  switch (result.goalStatus) {
    case 'proven':
      return `Proven: ${result.conclusion}`;
    case 'not_proven':
      return 'Not proven: a rule could establish this goal, but its premises are not all known.';
    case 'unknown':
      return 'Unknown: no initial fact or rule establishes this goal.';
    case 'not_requested':
      return 'No goal was requested.';
  }
}

export function KnowledgeLab() {
  const [mode, setMode] = useState<ChainingMode>('forward');
  const [goal, setGoal] = useState(EXAMPLE_GOAL);
  const [result, setResult] = useState<InferenceResult | null>(null);

  const handleRun = () => {
    const requestedGoal = goal.trim();
    setResult(
      mode === 'forward'
        ? forwardChain(INITIAL_FACTS, RULES, requestedGoal)
        : backwardChain(INITIAL_FACTS, RULES, requestedGoal),
    );
  };

  const handleReset = () => {
    setMode('forward');
    setGoal(EXAMPLE_GOAL);
    setResult(null);
  };

  return (
    <section className={styles.container} aria-labelledby="knowledge-lab-title">
      <header className={styles.header}>
        <div>
          <h2 className={styles.title} id="knowledge-lab-title">
            AI Foundations — Knowledge Representation &amp; Inference
          </h2>
          <p className={styles.description}>
            Explore how explicit facts and rules support deterministic conclusions.
            Every trace row below comes from the inference engine.
          </p>
        </div>
      </header>

      <div className={styles.columns}>
        <section className={styles.card} aria-labelledby="knowledge-base-title">
          <h3 className={styles.heading} id="knowledge-base-title">Knowledge Base</h3>
          <p className={styles.sectionNote}>
            Example: rain and cold are known. The rules describe consequences of those facts.
          </p>
          <h4 className={styles.subheading}>Initial facts</h4>
          <ul className={styles.factList} aria-label="Initial facts">
            {INITIAL_FACTS.map((fact) => <li key={fact}><code>{fact}</code></li>)}
          </ul>
          <h4 className={styles.subheading}>Rules</h4>
          <ol className={styles.ruleList} aria-label="Knowledge base rules">
            {RULES.map((rule) => (
              <li key={rule.id} className={styles.rule}>
                <code className={styles.ruleId}>{rule.id}</code>
                <p>{rule.description}</p>
                <div className={styles.ruleLogic}>
                  <span>{rule.premises.map((premise) => <code key={premise}>{premise}</code>)}</span>
                  <span aria-hidden="true">→</span>
                  <code>{rule.conclusion}</code>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.card} aria-labelledby="inference-controls-title">
          <h3 className={styles.heading} id="inference-controls-title">Inference Controls</h3>
          <div className={styles.controls}>
            <label className={styles.field}>
              <span>Chaining strategy</span>
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value as ChainingMode)}
                aria-label="Chaining strategy"
              >
                <option value="forward">Forward Chaining</option>
                <option value="backward">Backward Chaining</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Goal to check</span>
              <input
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="e.g. slippery"
                aria-label="Inference goal"
              />
            </label>
            <div className={styles.buttons}>
              <button className={styles.runButton} onClick={handleRun}>▶ Run inference</button>
              <button className={styles.resetButton} onClick={handleReset}>↺ Reset</button>
            </div>
          </div>

          {result ? (
            <div className={styles.result} role="status" aria-live="polite">
              <span className={styles.resultLabel}>Goal: <code>{goal.trim() || '(empty)'}</code></span>
              <strong>{describeGoalStatus(result)}</strong>
              <p>
                Newly derived facts:{' '}
                {result.derivedFacts.length > 0
                  ? result.derivedFacts.map((fact) => <code key={fact}>{fact}</code>)
                  : 'none'}
              </p>
            </div>
          ) : (
            <p className={styles.empty} role="status">Run inference to inspect the derived evidence.</p>
          )}
        </section>
      </div>

      <section className={styles.card} aria-labelledby="inference-trace-title">
        <h3 className={styles.heading} id="inference-trace-title">Evidence Trace</h3>
        <p className={styles.sectionNote}>
          Initial facts: {INITIAL_FACTS.map((fact) => <code key={fact}>{fact}</code>)}
          {mode === 'backward' && result && <> · Investigated goal: <code>{goal.trim()}</code></>}
        </p>
        {result ? (
          result.steps.length > 0 ? (
            <ol className={styles.traceList} aria-label="Inference evidence trace">
              {result.steps.map((step, index) => (
                <li key={`${index}-${step.ruleId}`} className={styles.traceStep}>
                  <div className={styles.traceTitle}>
                    <span>Step {index + 1}: <code>{step.ruleId}</code></span>
                    <strong className={step.premisesSatisfied ? styles.satisfied : styles.unsatisfied}>
                      {step.premisesSatisfied ? 'Premises satisfied' : 'Premises not satisfied'}
                    </strong>
                  </div>
                  <p>{step.description}</p>
                  <p>
                    Premises: {step.premises.length > 0
                      ? step.premises.map((premise) => <code key={premise}>{premise}</code>)
                      : 'none'}
                  </p>
                  <p>Conclusion: <code>{step.conclusion}</code></p>
                  {step.missingPremises.length > 0 && (
                    <p>Missing facts: {step.missingPremises.map((fact) => <code key={fact}>{fact}</code>)}</p>
                  )}
                  <p>
                    Newly derived: {step.newFacts.length > 0
                      ? step.newFacts.map((fact) => <code key={fact}>{fact}</code>)
                      : 'none'}
                  </p>
                  {step.cycleDetected && (
                    <p className={styles.cycleNote}>A premise cycle was detected; it was not assumed true.</p>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.empty}>No rule was evaluated for this goal; it is unknown to this knowledge base.</p>
          )
        ) : (
          <p className={styles.empty}>The rule evaluation trace will appear here after a run.</p>
        )}
      </section>

      <section className={styles.learning} aria-labelledby="learning-support-title">
        <h3 className={styles.heading} id="learning-support-title">Learning Support</h3>
        <div className={styles.columns}>
          <div>
            <h4 className={styles.subheading}>Forward vs. backward chaining</h4>
            <p><strong>Forward chaining</strong> starts with known facts, applies rules whose premises match, and continues until no new facts are produced.</p>
            <p><strong>Backward chaining</strong> starts with a goal and works backward through rules to see whether their premises can be established from known facts.</p>
          </div>
          <div>
            <h4 className={styles.subheading}>Worked example and limits</h4>
            <p>
              With initial facts <code>rain</code> and <code>cold</code>, the expected goal
              {' '}<code>slippery</code> is proven: <code>rain</code> derives <code>wet-grass</code>,
              then <code>wet-grass</code> with <code>cold</code> derives <code>slippery</code>.
            </p>
            <p>
              An unknown goal has no supporting rule or fact; a not-proven goal has a rule but
              unmet premises. Cycles do not create facts by themselves. Facts are exact-match
              strings, so positive and negative facts can coexist; this lab does not resolve
              contradictions or model formal negation.
            </p>
          </div>
        </div>
      </section>
    </section>
  );
}
