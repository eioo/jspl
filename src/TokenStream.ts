import InputStream from './InputStream';
import { IToken } from './interfaces';

export default class TokenStream {
  private current?: IToken;
  private keywords = ['if', 'then', 'else', 'lambda', 'true', 'false'];

  constructor(private input: InputStream) {}

  readWhile(condition: (input: string) => boolean) {
    const arr = [];

    while (!this.input.eof() && condition(this.input.peek())) {
      arr.push(this.input.next());
    }

    return arr.join('');
  }

  readNumber() {
    let hasDot = false;

    const num = this.readWhile(ch => {
      if (ch === '.') {
        if (hasDot) {
          return false;
        }

        hasDot = true;
        return true;
      }

      return this.isDigit(ch);
    });

    return {
      type: 'num',
      value: Number(num),
    };
  }

  readIdent() {
    const id = this.readWhile(this.isId);

    return {
      type: this.isKeyword(id) ? 'kw' : 'var',
      value: id,
    };
  }

  readEscaped(end: string) {
    let escaped = false;
    let str = '';

    this.input.next();

    while (!this.input.eof()) {
      const ch = this.input.next();

      if (escaped) {
        str += ch;
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === end) {
        break;
      } else {
        str += ch;
      }
    }

    return str;
  }

  readString() {
    return {
      type: 'str',
      value: this.readEscaped('"'),
    };
  }

  skipComment() {
    this.readWhile(ch => ch !== '\n');
    this.input.next();
  }

  readNext(): IToken | undefined {
    this.readWhile(this.isWhitespace);

    if (this.input.eof()) {
      return;
    }

    const ch = this.input.peek();

    if (ch === '#') {
      this.skipComment();
      return this.readNext();
    }

    if (ch === '"') {
      return this.readString();
    }

    if (this.isDigit(ch)) {
      return this.readNumber();
    }

    if (this.isIdStart(ch)) {
      return this.readIdent();
    }

    if (this.isPunc(ch)) {
      return {
        type: 'punc',
        value: this.input.next(),
      };
    }

    if (this.isOpChar(ch)) {
      return {
        type: 'op',
        value: this.readWhile(this.isOpChar),
      };
    }

    this.input.croak(`Can't handle character: ${ch}`);
    return;
  }

  next() {
    const token = this.current;
    this.current = undefined;
    return token || this.readNext();
  }

  peek() {
    return this.current || (this.current = this.readNext());
  }

  eof() {
    return this.peek() === undefined;
  }

  isKeyword(x: string) {
    return this.keywords.includes(x);
  }

  isDigit(ch: string) {
    return '0123456789'.includes(ch);
  }

  isIdStart(ch: string) {
    return 'abcdefghijklmnopqrstuvxyz_'.includes(ch);
  }

  isId = (ch: string) => {
    return this.isIdStart(ch) || '?!-<>=0123456789'.includes(ch);
  };

  isOpChar(ch: string) {
    return '+-*/%=&|<>!'.includes(ch);
  }

  isPunc(ch: string) {
    return ',;(){}[]'.includes(ch);
  }

  isWhitespace(ch: string) {
    return ' \t\n'.includes(ch);
  }

  croak(msg: string) {
    this.input.croak(msg);
  }
}
