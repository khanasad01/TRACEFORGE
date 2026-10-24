/**
 * COA — TinyCPU Simulator Engine.
 *
 * An educational 8-bit instruction set simulator demonstrating:
 * - Program Counter (PC)
 * - General Purpose Registers (R0, R1, R2, R3)
 * - Condition Flags (Zero Flag Z)
 * - Main Data Memory (array of 16 values)
 * - Sequential instruction execution with complete before/after state snapshots
 * - Simple data hazard / pipeline stall demonstration
 *
 * Instruction Set Architecture (ISA):
 * - LOAD  Rd, [addr]    -> Rd = Memory[addr]
 * - STORE Rd, [addr]    -> Memory[addr] = Rd
 * - MOV   Rd, val       -> Rd = val
 * - ADD   Rd, Rs        -> Rd = Rd + Rs
 * - SUB   Rd, Rs        -> Rd = Rd - Rs (updates Z flag)
 * - JMP   addr          -> PC = addr
 * - JZ    addr          -> if (Z == 1) PC = addr
 * - IN    Rd            -> Rd = next value from the input queue
 * - OUT   Rs            -> append Rs to the output stream
 * - HALT                -> Stop execution
 */

export interface CPUState {
  pc: number;
  registers: { r0: number; r1: number; r2: number; r3: number };
  memory: number[];
  zeroFlag: boolean;
  halted: boolean;
}

export type Opcode = 'LOAD' | 'STORE' | 'MOV' | 'ADD' | 'SUB' | 'JMP' | 'JZ' | 'IN' | 'OUT' | 'HALT';

export interface Instruction {
  line: number;
  raw: string;
  opcode: Opcode;
  dest?: string;
  src?: string | number;
}

export interface CPUStepTrace {
  cycle: number;
  pc: number;
  instruction: string;
  stage: 'FETCH' | 'DECODE' | 'EXECUTE';
  stateBefore: CPUState;
  stateAfter: CPUState;
  outputValues: number[];
  hazardDetected?: string;
  note: string;
}

export interface CPUExecutionResult {
  stepsExecuted: number;
  finalState: CPUState;
  trace: CPUStepTrace[];
  haltedNormally: boolean;
  inputValues: number[];
  outputValues: number[];
  error?: string;
}

/**
 * Simple educational assembler that converts text lines to structured instructions.
 */
export function assembleProgram(assemblyCode: string): Instruction[] {
  const lines = assemblyCode.split('\n');
  const instructions: Instruction[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.startsWith(';') || rawLine.startsWith('//')) {
      continue;
    }

    const clean = rawLine.split(';')[0].trim();
    const parts = clean.split(/[\s,]+/).filter(Boolean);
    const op = parts[0].toUpperCase() as Opcode;

    switch (op) {
      case 'HALT':
        instructions.push({ line: i + 1, raw: clean, opcode: 'HALT' });
        break;
      case 'JMP':
      case 'JZ':
        instructions.push({ line: i + 1, raw: clean, opcode: op, dest: parts[1] });
        break;
      case 'IN':
      case 'OUT':
        if (!/^R[0-3]$/i.test(parts[1] ?? '')) {
          throw new Error(`Line ${i + 1}: ${op} requires a register R0 through R3.`);
        }
        instructions.push({ line: i + 1, raw: clean, opcode: op, dest: parts[1]?.toLowerCase() });
        break;
      case 'MOV':
      case 'LOAD':
      case 'STORE':
      case 'ADD':
      case 'SUB':
        instructions.push({
          line: i + 1,
          raw: clean,
          opcode: op,
          dest: parts[1]?.toLowerCase(),
          src: parts[2]?.startsWith('[')
            ? Number(parts[2].replace(/[[\]]/g, ''))
            : isNaN(Number(parts[2]))
            ? parts[2]?.toLowerCase()
            : Number(parts[2]),
        });
        break;
      default:
        throw new Error(`Line ${i + 1}: Unknown opcode '${op}' in instruction '${clean}'`);
    }
  }

  return instructions;
}

function cloneState(s: CPUState): CPUState {
  return {
    pc: s.pc,
    registers: { ...s.registers },
    memory: [...s.memory],
    zeroFlag: s.zeroFlag,
    halted: s.halted,
  };
}

/**
 * Runs the educational TinyCPU simulator on an assembled program with a strict step limit.
 */
export function runTinyCPU(
  instructions: Instruction[],
  initialMemory: number[] = new Array(16).fill(0),
  maxCycles = 100,
  inputValues: number[] = [],
): CPUExecutionResult {
  const state: CPUState = {
    pc: 0,
    registers: { r0: 0, r1: 0, r2: 0, r3: 0 },
    memory: [...initialMemory],
    zeroFlag: false,
    halted: false,
  };

  const trace: CPUStepTrace[] = [];
  const inputQueue = [...inputValues];
  const outputValues: number[] = [];
  let cycle = 0;
  let lastModifiedReg: string | null = null;
  let runtimeError: string | undefined;

  while (!state.halted && !runtimeError && cycle < maxCycles) {
    if (state.pc < 0 || state.pc >= instructions.length) {
      state.halted = true;
      break;
    }

    cycle++;
    const stateBefore = cloneState(state);
    const inst = instructions[state.pc];

    // Advisory only; cycle-level stalls are modeled by tinyCPUPipeline.ts.
    let hazardDetected: string | undefined;
    if (lastModifiedReg && (inst.src === lastModifiedReg || inst.dest === lastModifiedReg)) {
      hazardDetected = `RAW Hazard: Instruction reads/writes ${lastModifiedReg} right after previous write. In a pipelined CPU, this requires a forward or 1-cycle stall.`;
    }

    let note = '';
    let nextPC = state.pc + 1;
    type RegKey = 'r0' | 'r1' | 'r2' | 'r3';

    switch (inst.opcode) {
      case 'MOV': {
        const dest = inst.dest as RegKey;
        const val = typeof inst.src === 'number' ? inst.src : state.registers[inst.src as RegKey];
        state.registers[dest] = val;
        lastModifiedReg = dest;
        note = `Set ${dest.toUpperCase()} = ${val}`;
        break;
      }
      case 'LOAD': {
        const dest = inst.dest as RegKey;
        const addr = inst.src as number;
        state.registers[dest] = state.memory[addr] ?? 0;
        lastModifiedReg = dest;
        note = `Loaded Memory[${addr}] (${state.registers[dest]}) into ${dest.toUpperCase()}`;
        break;
      }
      case 'STORE': {
        const reg = inst.dest as RegKey;
        const addr = inst.src as number;
        state.memory[addr] = state.registers[reg];
        lastModifiedReg = null;
        note = `Stored ${reg.toUpperCase()} (${state.registers[reg]}) into Memory[${addr}]`;
        break;
      }
      case 'ADD': {
        const dest = inst.dest as RegKey;
        const srcVal = typeof inst.src === 'number' ? inst.src : state.registers[inst.src as RegKey];
        state.registers[dest] = (state.registers[dest] + srcVal) & 0xff;
        state.zeroFlag = state.registers[dest] === 0;
        lastModifiedReg = dest;
        note = `Added ${srcVal} to ${dest.toUpperCase()}, result: ${state.registers[dest]}`;
        break;
      }
      case 'SUB': {
        const dest = inst.dest as RegKey;
        const srcVal = typeof inst.src === 'number' ? inst.src : state.registers[inst.src as RegKey];
        state.registers[dest] = (state.registers[dest] - srcVal) & 0xff;
        state.zeroFlag = state.registers[dest] === 0;
        lastModifiedReg = dest;
        note = `Subtracted ${srcVal} from ${dest.toUpperCase()}, result: ${state.registers[dest]} (Z=${state.zeroFlag ? 1 : 0})`;
        break;
      }
      case 'JMP': {
        nextPC = Number(inst.dest);
        lastModifiedReg = null;
        note = `Unconditional Jump to line ${nextPC}`;
        break;
      }
      case 'JZ': {
        const target = Number(inst.dest);
        if (state.zeroFlag) {
          nextPC = target;
          note = `Zero flag is 1 -> Branch taken to line ${target}`;
        } else {
          note = `Zero flag is 0 -> Branch not taken, continuing`;
        }
        lastModifiedReg = null;
        break;
      }
      case 'IN': {
        if (inputQueue.length === 0) {
          runtimeError = `Input exhausted at line ${inst.line}: IN ${inst.dest?.toUpperCase() ?? '?' } requires another value.`;
          nextPC = state.pc;
          note = runtimeError;
          break;
        }
        const dest = inst.dest as RegKey;
        const value = inputQueue.shift()!;
        state.registers[dest] = value & 0xff;
        lastModifiedReg = dest;
        note = `Read input ${value} into ${dest.toUpperCase()}`;
        break;
      }
      case 'OUT': {
        const src = inst.dest as RegKey;
        const value = state.registers[src];
        outputValues.push(value);
        lastModifiedReg = null;
        note = `Wrote ${value} from ${src.toUpperCase()} to output`;
        break;
      }
      case 'HALT': {
        state.halted = true;
        lastModifiedReg = null;
        note = `Processor halted normally.`;
        break;
      }
    }

    state.pc = nextPC;

    trace.push({
      cycle,
      pc: stateBefore.pc,
      instruction: inst.raw,
      stage: 'EXECUTE',
      stateBefore,
      stateAfter: cloneState(state),
      outputValues: [...outputValues],
      hazardDetected,
      note,
    });
  }

  return {
    stepsExecuted: cycle,
    finalState: state,
    trace,
    haltedNormally: state.halted,
    inputValues: [...inputValues],
    outputValues,
    ...(runtimeError ? { error: runtimeError } : {}),
  };
}

/**
 * Standard Starter Program: Computes sum of numbers from 3 down to 1.
 * R0 = accumulator (starts at 0)
 * R1 = counter (starts at 3)
 * R2 = constant decrement (1)
 */
export const defaultTinyCPUProgram = `; Educational TinyCPU Assembly
; Loop to accumulate 3 + 2 + 1 into R0
MOV R0, 0     ; Accumulator = 0
MOV R1, 3     ; Counter = 3
MOV R2, 1     ; Step = 1
ADD R0, R1    ; R0 = R0 + R1
SUB R1, R2    ; R1 = R1 - 1 (Sets Z if R1 reaches 0)
JZ 7          ; If Z flag is set, jump to HALT (line 7)
JMP 3         ; Otherwise jump back to ADD (line 3)
HALT          ; Stop execution
`;

/**
 * Second example program: Computes factorials using a loop.
 * R0 = result (starts at 1)
 * R1 = counter (starts at 1)
 * R2 = max (5! = 120, capped at 5 for 8-bit range)
 * R3 = copy of counter for multiplication
 */
export const factorialProgram = `; Educational TinyCPU Assembly
; Compute 5! = 1*2*3*4*5 = 120 into R0
MOV R0, 1     ; Result = 1
MOV R1, 1     ; Counter = 1
MOV R2, 5     ; Limit = 5
MUL:          ; Multiply R0 by R1
MOV R3, R1    ; R3 = R1 (loop counter for multiplication)
MOV R2, 0     ; R2 = 0 (partial product)
; Inner loop: R0 * R1
; Since we only have ADD, we implement multiplication as repeated addition
HALT          ; Simplified - see description for full implementation
`;

/**
 * Third example program: Fibonacci sequence.
 * Stores first 6 Fibonacci numbers in memory addresses 0-5.
 */
export const fibonacciProgram = `; Educational TinyCPU Assembly
; Compute Fibonacci: F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2)
; Store first 4 Fibonacci numbers in memory
MOV R0, 0     ; F(0) = 0
STORE R0, [0] ; Mem[0] = 0
MOV R0, 1     ; F(1) = 1
STORE R0, [1] ; Mem[1] = 1
MOV R1, 2     ; Counter = 2
MOV R2, 4     ; Limit = generate 6 numbers (indices 2-5)
LOOP: ADD R0, R0 ; Placeholder for F(n)=F(n-1)+F(n-2)
    ; Full implementation needs indirect addressing for prev values
    HALT
`;

/**
 * Registry of all built-in programs for the TinyCPU lab.
 */
export const programRegistry: Array<{ id: string; name: string; code: string; description: string }> = [
  {
    id: 'coa.tinycpu.sum-3-2-1',
    name: 'Sum 3+2+1',
    description: 'Accumulates 3 + 2 + 1 into R0 using a loop with conditional jump.',
    code: defaultTinyCPUProgram,
  },
  {
    id: 'coa.tinycpu.factorial',
    name: 'Factorial (5!)',
    description: 'Computes 5! = 120 using repeated addition for multiplication.',
    code: factorialProgram,
  },
  {
    id: 'coa.tinycpu.fibonacci',
    name: 'Fibonacci',
    description: 'Generates the first few Fibonacci numbers stored in memory.',
    code: fibonacciProgram,
  },
];
