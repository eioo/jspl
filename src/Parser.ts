import { ASTNode, IPrecedence } from './interfaces';
import TokenStream from './TokenStream';

export default class Parser {
  private precedence: IPrecedence = {
    '=': 1,
    '||': 2,
    '&&': 3,
    '<': 7,
    '>': 7,
    '<=': 7,
    '>=': 7,
    '==': 7,
    '!=': 7,
    '+': 10,
    '-': 10,
    '*': 20,
    '/': 20,
    '%': 20,
  };

  constructor(public input: TokenStream) {}

  parse() {
    return this.parseToplevel();
  }

  isPunc(ch: string) {
    const token = this.input.peek();
    return token && token.type === 'punc' && (!ch || token.value === ch);
  }

  isKw(kw: string) {
    const token = this.input.peek();
    return token && token.type === 'kw' && (!kw || token.value === kw);
  }

  isOp(op: string) {
    const token = this.input.peek();
    return token && token.type === 'op' && (!op || token.value === op);
  }

  skipPunc(ch: string) {
    this.isPunc(ch)
      ? this.input.next()
      : this.input.croak(`Expecting punctuation: ${ch}`);
  }

  skipKw(kw: string) {
    this.isKw(kw)
      ? this.input.next()
      : this.input.croak(`Expecting keyword: ${kw}`);
  }

  skipOp(op: string) {
    this.isOp(op)
      ? this.input.next()
      : this.input.croak(`Expecting operator: ${op}`);
  }

  unexpected() {
    this.input.croak(`Unexpected token: ${JSON.stringify(this.input.peek())}`);
  }

  maybeBinary(left: ASTNode, myPrec: number): ASTNode {
    /* TODO: May not work */
    const token = this.input.peek();

    if (token) {
      const hisPrec = this.precedence[token.value];

      if (hisPrec > myPrec) {
        this.input.next();

        const right = this.maybeBinary(this.parseAtom(), hisPrec);

        const binary = {
          type: token.value === '=' ? 'assign' : 'binary',
          operator: token.value,
          left,
          right,
        };

        return this.maybeBinary(binary as ASTNode, myPrec);
      }
    }

    return left;
  }

  delimited(start: string, stop: string, seperator: string, parser: () => any) {
    const result = [];
    let first = true;

    this.skipPunc(start);

    while (!this.input.eof()) {
      if (this.isPunc(stop)) {
        break;
      }

      if (first) {
        first = false;
      } else {
        this.skipPunc(seperator);
      }

      if (this.isPunc(stop)) {
        break;
      }

      result.push(parser());
    }

    this.skipPunc(stop);
    return result;
  }

  parseCall(func: ASTNode): ASTNode {
    return {
      type: 'call',
      func,
      args: this.delimited('(', ')', ',', this.parseExpression),
    };
  }

  parseVarname = () => {
    const name = this.input.next();

    if (!name || name.type !== 'var') {
      this.input.croak('Expecting variable name');
      return;
    }

    return name.value;
  };

  parseIf(): ASTNode {
    this.skipKw('if');
    const cond = this.parseExpression();

    if (!this.isPunc('{')) {
      this.skipKw('then');
    }

    const then = this.parseExpression();
    const ret: ASTNode = {
      type: 'if',
      cond,
      then,
    };

    if (this.isKw('else')) {
      this.input.next();
      ret.else = this.parseExpression();
    }

    return ret;
  }

  parseLambda(): ASTNode {
    return {
      type: 'lambda',
      vars: this.delimited('(', ')', ',', this.parseVarname),
      body: this.parseExpression(),
    };
  }

  parseBool(): ASTNode | undefined {
    const token = this.input.next();

    if (!token) {
      this.input.croak('Expecting boolean');
      return;
    }

    return {
      type: 'bool',
      value: token.value === 'true',
    };
  }

  maybeCall(expr: () => any) {
    const ret = expr();
    return this.isPunc('(') ? this.parseCall(ret) : ret;
  }

  parseAtom() {
    return this.maybeCall(() => {
      if (this.isPunc('(')) {
        this.input.next();
        const exp = this.parseExpression();
        this.skipPunc(')');
        return exp;
      }

      if (this.isPunc('{')) {
        return this.parseProg();
      }

      if (this.isKw('if')) {
        return this.parseIf();
      }

      if (this.isKw('true') || this.isKw('false')) {
        return this.parseBool();
      }

      if (this.isKw('lambda')) {
        this.input.next();
        return this.parseLambda();
      }

      const token = this.input.next();

      if (token && ['var', 'num', 'str'].includes(token.type)) {
        return token;
      }

      this.unexpected();
    });
  }

  parseToplevel(): ASTNode {
    const prog = [];

    while (!this.input.eof()) {
      prog.push(this.parseExpression());

      if (!this.input.eof()) {
        this.skipPunc(';');
      }
    }

    return {
      type: 'prog',
      prog,
    };
  }

  parseProg() {
    const prog = this.delimited('{', '}', ';', this.parseExpression);

    if (prog.length === 0) {
      return false;
    }

    if (prog.length === 1) {
      return prog[0];
    }

    return { type: 'prog', prog };
  }

  parseExpression = (): any => {
    return this.maybeCall(() => this.maybeBinary(this.parseAtom(), 0));
  };
}
