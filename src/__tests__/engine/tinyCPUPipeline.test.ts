import { describe, expect, it } from 'vitest';
import { assembleProgram } from '../../engine/tinyCPU';
import { simulateTinyCPUPipeline } from '../../engine/tinyCPUPipeline';

describe('TinyCPU cycle pipeline', () => {
  it('models all five stages and the fill/drain cycles', () => {
    const instructions = assembleProgram('MOV R0, 1\nHALT');
    const result = simulateTinyCPUPipeline(instructions);

    expect(result.trace[0].stages.IF?.raw).toBe('MOV R0, 1');
    expect(result.trace.find((cycle) => cycle.stages.WB?.raw === 'MOV R0, 1')).toBeDefined();
    expect(result.cycles).toBe(6);
    expect(result.idealCycles).toBe(6);
    expect(result.stalls).toBe(0);
  });

  it('inserts actual bubbles until a RAW dependency reaches writeback', () => {
    const instructions = assembleProgram('MOV R0, 5\nADD R1, R0\nHALT');
    const result = simulateTinyCPUPipeline(instructions);
    const stalls = result.trace.filter((cycle) => cycle.stalled);

    expect(stalls).toHaveLength(2);
    expect(stalls[0].stages.EX?.raw).toBe('MOV R0, 5');
    expect(stalls[0].stages.ID?.raw).toBe('ADD R1, R0');
    expect(stalls[0].stallReason).toContain('RAW hazard');
    expect(result.cycles).toBe(result.idealCycles + 2);
  });

  it('recognizes dependencies from a load and a store operand', () => {
    const result = simulateTinyCPUPipeline(
      assembleProgram('LOAD R0, [0]\nSTORE R0, [1]\nHALT'),
    );

    expect(result.stalls).toBe(2);
    expect(result.trace.some((cycle) => cycle.stallReason?.includes('LOAD R0, [0]'))).toBe(true);
  });

  it('does not stall independent instructions or immediate operands', () => {
    const result = simulateTinyCPUPipeline(
      assembleProgram('MOV R0, 1\nMOV R1, 2\nADD R2, 3\nHALT'),
    );
    expect(result.stalls).toBe(0);
    expect(result.cycles).toBe(result.idealCycles);
  });

  it('handles an empty stream and enforces the instruction bound', () => {
    expect(simulateTinyCPUPipeline([]).cycles).toBe(0);
    const tooMany = Array.from({ length: 201 }, () => assembleProgram('HALT')[0]);
    expect(() => simulateTinyCPUPipeline(tooMany)).toThrow(/limited to 200/);
  });
});
