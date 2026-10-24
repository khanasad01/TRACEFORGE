import { describe, expect, it } from 'vitest';
import { backwardChain, forwardChain, type Rule } from '../../engine/inference';

const rules: Rule[] = [
  {
    id: 'r-wet-grass',
    premises: ['rain'],
    conclusion: 'wet-grass',
    description: 'Rain makes the grass wet.',
  },
  {
    id: 'r-slippery',
    premises: ['wet-grass', 'cold'],
    conclusion: 'slippery',
    description: 'Wet grass is slippery when it is cold.',
  },
];

describe('forwardChain', () => {
  it('infers a conclusion directly from a known fact', () => {
    const result = forwardChain(['rain'], rules);

    expect(result.derivedFacts).toEqual(['wet-grass']);
    expect(result.goalStatus).toBe('not_requested');
  });

  it('derives multi-step conclusions to a fixed point', () => {
    const result = forwardChain(['rain', 'cold'], rules, 'slippery');

    expect(result.derivedFacts).toEqual(['wet-grass', 'slippery']);
    expect(result.conclusion).toBe('slippery');
    expect(result.goalStatus).toBe('proven');
    expect(result.steps.some((step) => step.round === 1 && step.newFacts.includes('slippery'))).toBe(true);
  });

  it('reports a derivable but unsupported goal as not proven', () => {
    const result = forwardChain(['rain'], rules, 'slippery');

    expect(result.conclusion).toBeNull();
    expect(result.goalStatus).toBe('not_proven');
  });

  it('reports a goal absent from facts and rule conclusions as unknown', () => {
    const result = forwardChain(['rain'], rules, 'sunny');

    expect(result.conclusion).toBeNull();
    expect(result.goalStatus).toBe('unknown');
  });

  it('records each evaluated rule with its actual premises and derived facts', () => {
    const result = forwardChain(['rain'], rules);
    const firedStep = result.steps.find((step) => step.ruleId === 'r-wet-grass');
    const blockedStep = result.steps.find((step) => step.ruleId === 'r-slippery');

    expect(firedStep).toMatchObject({
      description: 'Rain makes the grass wet.',
      premises: ['rain'],
      premisesSatisfied: true,
      missingPremises: [],
      conclusion: 'wet-grass',
      newFacts: ['wet-grass'],
      round: 1,
    });
    expect(blockedStep).toMatchObject({
      premisesSatisfied: false,
      missingPremises: ['cold'],
      newFacts: [],
    });
  });

  it('terminates on cyclic rules without deriving unsupported facts', () => {
    const cyclicRules: Rule[] = [
      { id: 'r-a-b', premises: ['b'], conclusion: 'a', description: 'B implies A.' },
      { id: 'r-b-a', premises: ['a'], conclusion: 'b', description: 'A implies B.' },
    ];
    const result = forwardChain([], cyclicRules);

    expect(result.derivedFacts).toEqual([]);
    expect(result.steps).toHaveLength(cyclicRules.length);
  });

  it('keeps contradictory positive and negative literals as separate facts', () => {
    const result = forwardChain(
      ['signal'],
      [
        { id: 'r-rain', premises: ['signal'], conclusion: 'rain', description: 'Signal implies rain.' },
        { id: 'r-not-rain', premises: ['signal'], conclusion: 'not-rain', description: 'Signal implies not-rain.' },
      ],
    );

    expect(result.derivedFacts).toEqual(['rain', 'not-rain']);
    expect(result.steps.filter((step) => step.newFacts.length > 0)).toHaveLength(2);
  });
});

describe('backwardChain', () => {
  it('proves a goal and traces the multi-step supporting rules', () => {
    const result = backwardChain(['rain', 'cold'], rules, 'slippery');

    expect(result.conclusion).toBe('slippery');
    expect(result.goalStatus).toBe('proven');
    expect(result.derivedFacts).toEqual(['wet-grass', 'slippery']);
    expect(result.steps.map((step) => step.ruleId)).toEqual(['r-wet-grass', 'r-slippery']);
    expect(result.steps.every((step) => step.premisesSatisfied)).toBe(true);
  });

  it('does not prove a goal when a required fact is unavailable', () => {
    const result = backwardChain(['rain'], rules, 'slippery');

    expect(result.conclusion).toBeNull();
    expect(result.goalStatus).toBe('not_proven');
    expect(result.steps[result.steps.length - 1]).toMatchObject({
      ruleId: 'r-slippery',
      premisesSatisfied: false,
      missingPremises: ['cold'],
      newFacts: [],
    });
  });

  it('reports goals with no possible rule as unknown', () => {
    const result = backwardChain([], rules, 'sunny');

    expect(result.conclusion).toBeNull();
    expect(result.goalStatus).toBe('unknown');
    expect(result.steps).toEqual([]);
  });

  it('terminates and reports unsupported cyclic goals as not proven', () => {
    const cyclicRules: Rule[] = [
      { id: 'r-a-b', premises: ['b'], conclusion: 'a', description: 'B implies A.' },
      { id: 'r-b-a', premises: ['a'], conclusion: 'b', description: 'A implies B.' },
    ];
    const result = backwardChain([], cyclicRules, 'a');

    expect(result.conclusion).toBeNull();
    expect(result.goalStatus).toBe('not_proven');
    expect(result.steps).toHaveLength(2);
    expect(result.steps.some((step) => step.cycleDetected)).toBe(true);
    expect(result.steps.every((step) => step.newFacts.length === 0)).toBe(true);
  });

  it('allows contradictory literals without an implicit consistency policy', () => {
    const result = backwardChain(
      ['rain'],
      [
        { id: 'r-not-rain', premises: ['rain'], conclusion: 'not-rain', description: 'Example conflicting rule.' },
      ],
      'not-rain',
    );

    expect(result.conclusion).toBe('not-rain');
    expect(result.goalStatus).toBe('proven');
    expect(result.derivedFacts).toEqual(['not-rain']);
  });
});
