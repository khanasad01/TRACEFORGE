import type { Instruction } from './tinyCPU';

export type PipelineStage = 'IF' | 'ID' | 'EX' | 'MEM' | 'WB';

export type PipelineStages = Record<PipelineStage, Instruction | null>;

export interface PipelineCycleTrace {
  cycle: number;
  stages: PipelineStages;
  stalled: boolean;
  stallReason?: string;
}

export interface PipelineResult {
  trace: PipelineCycleTrace[];
  cycles: number;
  stalls: number;
  instructions: number;
  idealCycles: number;
}

const PIPELINE_STAGES: PipelineStage[] = ['IF', 'ID', 'EX', 'MEM', 'WB'];
const MAX_PIPELINE_INSTRUCTIONS = 200;

function writtenRegister(instruction: Instruction | null): string | null {
  if (!instruction) return null;
  if (['MOV', 'LOAD', 'ADD', 'SUB'].includes(instruction.opcode)) {
    return instruction.dest ?? null;
  }
  return null;
}

function readRegisters(instruction: Instruction | null): string[] {
  if (!instruction) return [];

  const registers: string[] = [];
  if (instruction.opcode === 'ADD' || instruction.opcode === 'SUB') {
    if (instruction.dest) registers.push(instruction.dest);
  }
  if (
    (instruction.opcode === 'MOV' || instruction.opcode === 'ADD' || instruction.opcode === 'SUB')
    && typeof instruction.src === 'string'
  ) {
    registers.push(instruction.src);
  }
  if (instruction.opcode === 'STORE' && instruction.dest) {
    registers.push(instruction.dest);
  }
  return registers;
}

function findRawHazard(stages: PipelineStages): string | undefined {
  const waiting = stages.ID;
  if (!waiting) return undefined;

  for (const producerStage of ['EX', 'MEM'] as const) {
    const producer = stages[producerStage];
    if (!producer) continue;
    const register = writtenRegister(producer);
    if (register && readRegisters(waiting).includes(register)) {
      return `RAW hazard: ${waiting.raw} waits for ${register.toUpperCase()} from ${producer.raw} in ${producerStage}; the consumer remains in ID.`;
    }
  }
  return undefined;
}

function hasInstruction(stages: PipelineStages): boolean {
  return PIPELINE_STAGES.some((stage) => stages[stage] !== null);
}

/**
 * Schedules an assembled instruction stream through a single-issue, five-stage
 * pipeline without forwarding. WB writes are visible to ID in the same cycle.
 */
export function simulateTinyCPUPipeline(instructions: Instruction[]): PipelineResult {
  if (instructions.length > MAX_PIPELINE_INSTRUCTIONS) {
    throw new Error(`Pipeline input is limited to ${MAX_PIPELINE_INSTRUCTIONS} instructions.`);
  }

  const trace: PipelineCycleTrace[] = [];
  const stages: PipelineStages = {
    IF: instructions[0] ?? null,
    ID: null,
    EX: null,
    MEM: null,
    WB: null,
  };
  let nextInstruction = instructions.length > 0 ? 1 : 0;
  let stalls = 0;

  while (hasInstruction(stages)) {
    const cycle = trace.length + 1;
    const stallReason = findRawHazard(stages);
    const stalled = stallReason !== undefined;

    trace.push({
      cycle,
      stages: { ...stages },
      stalled,
      ...(stallReason ? { stallReason } : {}),
    });

    const nextStages: PipelineStages = {
      WB: stages.MEM,
      MEM: stages.EX,
      EX: stalled ? null : stages.ID,
      ID: stalled ? stages.ID : stages.IF,
      IF: stalled ? stages.IF : instructions[nextInstruction] ?? null,
    };

    if (stalled) {
      stalls++;
    } else if (nextStages.IF) {
      nextInstruction++;
    }

    Object.assign(stages, nextStages);
  }

  return {
    trace,
    cycles: trace.length,
    stalls,
    instructions: instructions.length,
    idealCycles: instructions.length === 0 ? 0 : instructions.length + 4,
  };
}
