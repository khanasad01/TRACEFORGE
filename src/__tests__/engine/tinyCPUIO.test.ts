import { describe, expect, it } from 'vitest';
import { assembleProgram, runTinyCPU } from '../../engine/tinyCPU';

describe('TinyCPU input and output instructions', () => {
  it('reads queued values, computes a sum, and records output at the OUT step', () => {
    const instructions = assembleProgram('IN R0\nIN R1\nADD R0, R1\nOUT R0\nHALT');
    const result = runTinyCPU(instructions, undefined, 100, [12, 7]);

    expect(result.haltedNormally).toBe(true);
    expect(result.inputValues).toEqual([12, 7]);
    expect(result.outputValues).toEqual([19]);
    expect(result.trace.find((step) => step.instruction === 'OUT R0')?.outputValues).toEqual([19]);
    expect(result.finalState.registers.r0).toBe(19);
  });

  it('stops clearly when an IN instruction has no remaining input', () => {
    const result = runTinyCPU(assembleProgram('IN R0\nHALT'), undefined, 100, []);
    expect(result.haltedNormally).toBe(false);
    expect(result.error).toMatch(/Input exhausted/);
    expect(result.finalState.pc).toBe(0);
  });

  it('stores input values as unsigned bytes', () => {
    const result = runTinyCPU(assembleProgram('IN R0\nOUT R0\nHALT'), undefined, 100, [260]);
    expect(result.outputValues).toEqual([4]);
  });

  it('accepts the IN and OUT instructions through the assembler', () => {
    expect(assembleProgram('IN R2\nOUT R2').map((instruction) => instruction.opcode))
      .toEqual(['IN', 'OUT']);
  });
});
