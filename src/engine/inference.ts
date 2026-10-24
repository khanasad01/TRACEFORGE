/**
 * Deterministic propositional inference using forward and backward chaining.
 *
 * Facts are opaque, exact-match strings. Negation has no built-in logic:
 * callers may represent a negative literal as a separate fact (for example,
 * "not-raining"), and positive and negative literals may both be derived.
 * The engine is monotonic and does not resolve contradictions.
 *
 * A goal with no fact or rule that can establish it is "unknown". A goal
 * with one or more producing rules whose premises cannot be established is
 * "not_proven". Neither status treats the absence of a fact as false.
 */

export interface Rule {
  id: string;
  premises: string[];
  conclusion: string;
  description: string;
}

export interface InferenceStep {
  ruleId: string;
  description: string;
  premises: string[];
  premisesSatisfied: boolean;
  missingPremises: string[];
  conclusion: string;
  newFacts: string[];
  /** Forward-chaining pass number; omitted for backward chaining. */
  round?: number;
  /** True when backward chaining detected a premise cycle for this rule. */
  cycleDetected?: boolean;
}

export type GoalStatus = 'not_requested' | 'proven' | 'not_proven' | 'unknown';

export interface InferenceResult {
  derivedFacts: string[];
  steps: InferenceStep[];
  /** The requested goal when proven; otherwise null. */
  conclusion: string | null;
  goalStatus: GoalStatus;
}

function uniqueFacts(facts: readonly string[]): string[] {
  return [...new Set(facts)];
}

/**
 * Repeatedly evaluates every rule until a complete pass derives no new facts.
 * Rules and facts retain input/derivation order in the result and trace.
 */
export function forwardChain(
  initialFacts: readonly string[],
  rules: readonly Rule[],
  goal?: string,
): InferenceResult {
  const knownFacts = new Set(initialFacts);
  const derivedFacts: string[] = [];
  const steps: InferenceStep[] = [];
  let round = 0;
  let addedFact = true;

  while (addedFact) {
    round++;
    addedFact = false;

    for (const rule of rules) {
      const missingPremises = rule.premises.filter(
        (premise) => !knownFacts.has(premise),
      );
      const premisesSatisfied = missingPremises.length === 0;
      const newFacts =
        premisesSatisfied && !knownFacts.has(rule.conclusion)
          ? [rule.conclusion]
          : [];

      steps.push({
        ruleId: rule.id,
        description: rule.description,
        premises: [...rule.premises],
        premisesSatisfied,
        missingPremises,
        conclusion: rule.conclusion,
        newFacts,
        round,
      });

      if (newFacts.length > 0) {
        knownFacts.add(rule.conclusion);
        derivedFacts.push(rule.conclusion);
        addedFact = true;
      }
    }
  }

  const goalStatus = goal === undefined
    ? 'not_requested'
    : knownFacts.has(goal)
      ? 'proven'
      : rules.some((rule) => rule.conclusion === goal)
        ? 'not_proven'
        : 'unknown';

  return {
    derivedFacts,
    steps,
    conclusion: goalStatus === 'proven' ? goal! : null,
    goalStatus,
  };
}

/**
 * Attempts to prove a goal recursively from initial facts and rules.
 * A fact is derived only after every premise of a rule is proven. Active-goal
 * tracking cuts cycles without assuming that a cyclic goal is true.
 */
export function backwardChain(
  initialFacts: readonly string[],
  rules: readonly Rule[],
  goal: string,
): InferenceResult {
  const knownFacts = new Set(initialFacts);
  const derivedFacts: string[] = [];
  const steps: InferenceStep[] = [];
  const activeGoals = new Set<string>();
  const goalsWithRules = new Set(
    rules.map((rule) => rule.conclusion),
  );

  interface Proof {
    proven: boolean;
    cycleDetected: boolean;
  }

  function prove(fact: string): Proof {
    if (knownFacts.has(fact)) {
      return { proven: true, cycleDetected: false };
    }
    if (activeGoals.has(fact)) {
      return { proven: false, cycleDetected: true };
    }

    activeGoals.add(fact);
    let cycleDetected = false;

    for (const rule of rules) {
      if (rule.conclusion !== fact) continue;

      const premiseProofs = rule.premises.map(prove);
      const ruleCycleDetected = premiseProofs.some((proof) => proof.cycleDetected);
      cycleDetected ||= ruleCycleDetected;

      const missingPremises = rule.premises.filter(
        (premise) => !knownFacts.has(premise),
      );
      const premisesSatisfied = missingPremises.length === 0;
      const newFacts = premisesSatisfied ? [rule.conclusion] : [];

      steps.push({
        ruleId: rule.id,
        description: rule.description,
        premises: [...rule.premises],
        premisesSatisfied,
        missingPremises,
        conclusion: rule.conclusion,
        newFacts,
        cycleDetected: ruleCycleDetected,
      });

      if (premisesSatisfied) {
        knownFacts.add(rule.conclusion);
        derivedFacts.push(rule.conclusion);
        activeGoals.delete(fact);
        return { proven: true, cycleDetected };
      }
    }

    activeGoals.delete(fact);
    return { proven: false, cycleDetected };
  }

  const proof = prove(goal);
  const goalStatus: GoalStatus = proof.proven
    ? 'proven'
    : goalsWithRules.has(goal)
      ? 'not_proven'
      : 'unknown';

  return {
    derivedFacts: uniqueFacts(derivedFacts),
    steps,
    conclusion: proof.proven ? goal : null,
    goalStatus,
  };
}
