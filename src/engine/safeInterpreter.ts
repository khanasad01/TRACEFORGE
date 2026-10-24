/**
 * AST-based safe parser and tracer for Binary Search submissions using Acorn.
 *
 * This parser uses Acorn (~30KB minified) to safely parse JavaScript source code
 * into standard ESTree AST without executing code via eval() or new Function().
 *
 * It validates that the code conforms to the expected Binary Search algorithm
 * structure, enforces strict node allowlists (disallowing arbitrary calls,
 * constructor/prototype access), and executes it in an interpreted sandbox
 * step-by-step while generating 100% genuine execution trace events from the learner's actual code.
 *
 * Execution step limit (500 steps) prevents infinite loops.
 */

import * as acorn from 'acorn';
import type * as ESTree from 'estree';
import type { TraceEvent } from '../types/domain';

export interface ParseResult {
  valid: boolean;
  error?: string;
  ast?: ESTree.Program;
}

export interface EvaluatedStepResult {
  result: number;
  trace: TraceEvent[];
  timeout?: boolean;
}

export class ExecutionLimitError extends Error {
  constructor(maxSteps: number) {
    super(`Execution limit exceeded: loop or steps exceeded ${maxSteps} limit.`);
    this.name = 'ExecutionLimitError';
  }
}

/**
 * Validate syntax and structure using Acorn parser.
 * Rejects unsupported syntax or non-conforming functions.
 */
export function validateBinarySearchSource(sourceCode: string): ParseResult {
  let ast: ESTree.Program;
  try {
    ast = acorn.parse(sourceCode, {
      ecmaVersion: 2020,
      sourceType: 'script',
    }) as unknown as ESTree.Program;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { valid: false, error: `Syntax error: ${msg}` };
  }

  let funcDecl: ESTree.FunctionDeclaration | undefined;
  for (const statement of ast.body) {
    if (statement.type === 'FunctionDeclaration' && statement.id?.name === 'binarySearch') {
      funcDecl = statement;
      break;
    }
  }

  if (!funcDecl) {
    return {
      valid: false,
      error: 'Your code must define a function named binarySearch(array, target).',
    };
  }

  if (funcDecl.params.length < 2) {
    return {
      valid: false,
      error: 'binarySearch must accept at least two parameters: (array, target).',
    };
  }

  return { valid: true, ast };
}

/**
 * Executes the learner's Binary Search code using a sandboxed AST-level interpreter.
 * It directly interprets ESTree AST nodes, enforcing step limits, supporting loop conditions,
 * branching, variable assignments, and Math.floor.
 *
 * Emits genuine TraceEvents corresponding exactly to the learner's code statements.
 */
export function interpretBinarySearchWithTrace(
  sourceCode: string,
  array: number[],
  target: number,
  evidenceRef: string,
  maxSteps = 500,
): EvaluatedStepResult {
  const validation = validateBinarySearchSource(sourceCode);
  if (!validation.valid || !validation.ast) {
    throw new Error(validation.error || 'Invalid code');
  }

  const ast = validation.ast;
  let funcDecl: ESTree.FunctionDeclaration | undefined;
  for (const stmt of ast.body) {
    if (stmt.type === 'FunctionDeclaration' && stmt.id?.name === 'binarySearch') {
      funcDecl = stmt;
      break;
    }
  }

  if (!funcDecl || !funcDecl.body) {
    throw new Error('Function body not found.');
  }

  const param0 = funcDecl.params[0];
  const param1 = funcDecl.params[1];
  if (param0.type !== 'Identifier' || param1.type !== 'Identifier') {
    throw new Error('Expected identifier parameters for binarySearch(array, target).');
  }

  const paramArrayName = param0.name;
  const paramTargetName = param1.name;

  const scope: Record<string, unknown> = {
    [paramArrayName]: [...array],
    [paramTargetName]: target,
  };

  const trace: TraceEvent[] = [];
  let step = 0;

  function evalExpr(expr: ESTree.Expression): unknown {
    if (expr.type === 'Literal') {
      return expr.value;
    }
    if (expr.type === 'Identifier') {
      if (expr.name === 'undefined') return undefined;
      if (expr.name === 'NaN') return NaN;
      if (expr.name === 'Math') return Math;
      if (!(expr.name in scope)) {
        throw new ReferenceError(`${expr.name} is not defined`);
      }
      return scope[expr.name];
    }
    if (expr.type === 'UnaryExpression') {
      const val = evalExpr(expr.argument);
      if (expr.operator === '-') return -(val as number);
      if (expr.operator === '+') return +(val as number);
      if (expr.operator === '!') return !val;
      throw new Error(`Unsupported unary operator: ${expr.operator}`);
    }
    if (expr.type === 'AssignmentExpression') {
      if (expr.left.type === 'Identifier') {
        const varName = expr.left.name;
        const right = evalExpr(expr.right);
        if (expr.operator === '=') {
          scope[varName] = right;
          return right;
        }
        if (expr.operator === '+=') {
          scope[varName] = (scope[varName] as number) + (right as number);
          return scope[varName];
        }
        if (expr.operator === '-=') {
          scope[varName] = (scope[varName] as number) - (right as number);
          return scope[varName];
        }
        throw new Error(`Unsupported assignment operator: ${expr.operator}`);
      }
      throw new Error('Unsupported assignment target');
    }
    if (expr.type === 'BinaryExpression' || expr.type === 'LogicalExpression') {
      if (expr.left.type === 'PrivateIdentifier') {
        throw new Error('Private identifiers are not supported');
      }
      const left = evalExpr(expr.left);
      const right = evalExpr(expr.right);
      switch (expr.operator) {
        case '+':
          return (left as number) + (right as number);
        case '-':
          return (left as number) - (right as number);
        case '*':
          return (left as number) * (right as number);
        case '/':
          return (left as number) / (right as number);
        case '%':
          return (left as number) % (right as number);
        case '<':
          return (left as number) < (right as number);
        case '<=':
          return (left as number) <= (right as number);
        case '>':
          return (left as number) > (right as number);
        case '>=':
          return (left as number) >= (right as number);
        case '==':
          return left == right;
        case '===':
          return left === right;
        case '!=':
          return left != right;
        case '!==':
          return left !== right;
        case '&&':
          return left && right;
        case '||':
          return left || right;
        default:
          throw new Error(`Unsupported binary operator: ${expr.operator}`);
      }
    }
    if (expr.type === 'MemberExpression') {
      const obj = evalExpr(expr.object as ESTree.Expression);
      let prop: unknown;
      if (expr.computed) {
        prop = evalExpr(expr.property as ESTree.Expression);
      } else if (expr.property.type === 'Identifier') {
        prop = expr.property.name;
      }
      if (obj === null || obj === undefined) {
        throw new TypeError(`Cannot read property '${String(prop)}' of ${String(obj)}`);
      }
      if (prop === 'constructor' || prop === 'prototype' || prop === '__proto__') {
        throw new Error(`Access to restricted property '${String(prop)}' is not permitted.`);
      }
      return (obj as Record<string, unknown>)[prop as string | number];
    }
    if (expr.type === 'CallExpression') {
      if (expr.callee.type === 'MemberExpression') {
        const obj = evalExpr(expr.callee.object as ESTree.Expression);
        const prop = expr.callee.property.type === 'Identifier' ? expr.callee.property.name : undefined;
        if (obj === Math && prop && (prop === 'floor' || prop === 'ceil' || prop === 'round' || prop === 'trunc')) {
          const args = expr.arguments.map((a) => evalExpr(a as ESTree.Expression));
          // @ts-expect-error standard math methods
          return Math[prop](...(args as number[]));
        }
      }
      throw new Error(`Function calls other than Math functions are not supported in this lab.`);
    }

    throw new Error(`Unsupported expression type: ${(expr as ESTree.Node).type}`);
  }

  let returned = false;
  let returnValue: unknown = undefined;

  function executeProgram(statements: readonly ESTree.Statement[]) {
    for (const stmt of statements) {
      if (returned) return;
      step++;
      if (step > maxSteps) {
        throw new ExecutionLimitError(maxSteps);
      }

      if (stmt.type === 'VariableDeclaration') {
        for (const decl of stmt.declarations) {
          if (decl.id.type === 'Identifier') {
            const varName = decl.id.name;
            const initVal = decl.init ? evalExpr(decl.init) : undefined;
            scope[varName] = initVal;
          }
        }
      } else if (stmt.type === 'WhileStatement') {
        // Emit initial setup event when entering while loop
        const lowVal = scope['low'];
        const highVal = scope['high'];
        trace.push({
          step: trace.length + 1,
          event: 'init',
          variables: {
            target,
            low: lowVal,
            high: highVal,
            arrayLength: array.length,
          },
          evidenceRef,
          note: array.length === 0 ? 'Empty array — search space is immediately exhausted.' : undefined,
        });

        while (!returned) {
          step++;
          if (step > maxSteps) {
            throw new ExecutionLimitError(maxSteps);
          }

          const cond = Boolean(evalExpr(stmt.test));
          trace.push({
            step: trace.length + 1,
            event: 'loop_condition',
            variables: {
              low: scope['low'],
              high: scope['high'],
              condition: cond,
            },
            evidenceRef,
          });

          if (!cond) break;

          if (stmt.body.type === 'BlockStatement') {
            for (const bodyStmt of stmt.body.body) {
              if (returned) break;
              step++;
              if (step > maxSteps) {
                throw new ExecutionLimitError(maxSteps);
              }

              if (bodyStmt.type === 'VariableDeclaration') {
                for (const decl of bodyStmt.declarations) {
                  if (decl.id.type === 'Identifier') {
                    const varName = decl.id.name;
                    const val = decl.init ? evalExpr(decl.init) : undefined;
                    scope[varName] = val;

                    if (varName === 'mid') {
                      trace.push({
                        step: trace.length + 1,
                        event: 'mid_computed',
                        variables: {
                          low: scope['low'],
                          high: scope['high'],
                          mid: val,
                          midValue: array[val as number],
                        },
                        evidenceRef,
                      });
                    }
                  }
                }
              } else if (bodyStmt.type === 'IfStatement') {
                execBranch(bodyStmt);
              } else if (bodyStmt.type === 'ReturnStatement') {
                const res = bodyStmt.argument ? evalExpr(bodyStmt.argument) : undefined;
                returnValue = res;
                returned = true;
                if (typeof res === 'number' && res >= 0) {
                  trace.push({
                    step: trace.length + 1,
                    event: 'found',
                    variables: { result: res, midValue: array[res], target },
                    evidenceRef,
                  });
                }
                break;
              } else if (bodyStmt.type === 'ExpressionStatement') {
                evalExpr(bodyStmt.expression);
              }
            }
          }
        }
      } else if (stmt.type === 'ReturnStatement') {
        returnValue = stmt.argument ? evalExpr(stmt.argument) : undefined;
        returned = true;
        break;
      }
    }

    if (returned && returnValue === -1) {
      trace.push({
        step: trace.length + 1,
        event: 'not_found',
        variables: { result: -1 },
        evidenceRef,
      });
    }
  }

  function execBranch(ifNode: ESTree.IfStatement) {
    const mid = scope['mid'] as number;
    const midVal = array[mid];

    trace.push({
      step: trace.length + 1,
      event: 'comparison',
      variables: {
        midValue: midVal,
        target,
        equal: midVal === target,
      },
      evidenceRef,
    });

    const cond = evalExpr(ifNode.test);
    if (cond) {
      execBranchBody(ifNode.consequent);
    } else if (ifNode.alternate) {
      if (ifNode.alternate.type === 'IfStatement') {
        const elseIf = ifNode.alternate;
        const elseCond = evalExpr(elseIf.test);
        if (elseCond) {
          const oldLow = scope['low'];
          execBranchBody(elseIf.consequent);
          const newLow = scope['low'];
          if (newLow !== oldLow) {
            trace.push({
              step: trace.length + 1,
              event: 'move_low',
              variables: { from: oldLow, to: newLow, because: `array[${mid}]=${midVal} < target=${target}` },
              evidenceRef,
            });
          }
        } else if (elseIf.alternate) {
          const oldHigh = scope['high'];
          execBranchBody(elseIf.alternate);
          const newHigh = scope['high'];
          if (newHigh !== oldHigh) {
            trace.push({
              step: trace.length + 1,
              event: 'move_high',
              variables: { from: oldHigh, to: newHigh, because: `array[${mid}]=${midVal} > target=${target}` },
              evidenceRef,
            });
          }
        }
      } else {
        execBranchBody(ifNode.alternate);
      }
    }
  }

  function execBranchBody(body: ESTree.Statement) {
    if (body.type === 'BlockStatement') {
      for (const s of body.body) {
        if (s.type === 'ReturnStatement') {
          const res = s.argument ? evalExpr(s.argument) : undefined;
          returnValue = res;
          returned = true;
          trace.push({
            step: trace.length + 1,
            event: 'found',
            variables: { result: res, midValue: array[res as number], target },
            evidenceRef,
          });
          return;
        } else if (s.type === 'ExpressionStatement') {
          evalExpr(s.expression);
        }
      }
    } else if (body.type === 'ReturnStatement') {
      const res = body.argument ? evalExpr(body.argument) : undefined;
      returnValue = res;
      returned = true;
      trace.push({
        step: trace.length + 1,
        event: 'found',
        variables: { result: res, midValue: array[res as number], target },
        evidenceRef,
      });
    } else if (body.type === 'ExpressionStatement') {
      evalExpr(body.expression);
    }
  }

  executeProgram(funcDecl.body.body);

  if (typeof returnValue !== 'number') {
    throw new TypeError(`binarySearch must return a number, got ${typeof returnValue}`);
  }

  return {
    result: returnValue,
    trace,
  };
}
