import Environment from './Environment';
import { ASTNode, ILambdaNode } from './interfaces';

export function evaluate(exp: ASTNode, env: Environment): any {
  switch (exp.type) {
    case 'num':
    case 'str':
    case 'bool':
      return exp.value;
    case 'var':
      return env.get(exp.value);
    case 'assign':
      if (exp.left.type !== 'var') {
        throw new Error(`Cannot assign to ${JSON.stringify(exp.left)}`);
      }

      return env.set(exp.left.value, evaluate(exp.right, env));
    case 'binary':
      return applyOp(
        exp.operator,
        evaluate(exp.left, env),
        evaluate(exp.right, env)
      );
    case 'lambda':
      return makeLambda(env, exp);
    case 'if':
      const cond = evaluate(exp.cond, env);

      if (cond !== false) {
        return evaluate(exp.then, env);
      }

      return exp.else ? evaluate(exp.else, env) : false;
    case 'prog':
      let val = false;
      exp.prog.forEach(node => (val = evaluate(node, env)));
      return val;
    case 'call':
      const func = evaluate(exp.func, env);
      return func.apply(null, exp.args.map(arg => evaluate(arg, env)));
    default:
      throw new Error(`Don't know how to evaluate ${exp.type}`);
  }
}

function applyOp(op: string, a: any, b: any) {
  const num = (x: any) => {
    if (typeof x !== 'number') {
      throw new Error(`Expected number but got ${JSON.stringify(x)}`);
    }

    return x;
  };

  const div = (x: any) => {
    if (num(x) === 0) {
      throw new Error('Divide by zero');
    }
    return x;
  };

  switch (op) {
    case '+':
      return num(a) + num(b);
    case '-':
      return num(a) - num(b);
    case '*':
      return num(a) * num(b);
    case '/':
      return num(a) / div(b);
    case '%':
      return num(a) % div(b);
    case '&&':
      return a !== false && b;
    case '||':
      return a !== false ? a : b;
    case '<':
      return num(a) < num(b);
    case '>':
      return num(a) > num(b);
    case '<=':
      return num(a) <= num(b);
    case '>=':
      return num(a) >= num(b);
    case '==':
      return a === b;
    case '!=':
      return a !== b;
  }

  throw new Error(`Can't apply operator ${op}`);
}

function makeLambda(env: Environment, exp: ILambdaNode) {
  function lambda() {
    const names = exp.vars;
    const scope = env.extend();

    for (let i = 0; i < names.length; i++) {
      scope.def(names[i], i < arguments.length ? arguments[i] : false);
    }

    return evaluate(exp.body, scope);
  }

  return lambda;
}
