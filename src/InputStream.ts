export default class InputStream {
  private pos = 0;
  private line = 1;
  private col = 0;

  constructor(private input: string) {}

  next() {
    const ch = this.input.charAt(this.pos++);

    if (ch === '\n') {
      this.line++;
      this.col = 0;
    } else {
      this.col++;
    }

    return ch;
  }

  peek() {
    return this.input.charAt(this.pos);
  }

  eof() {
    return this.peek() === '';
  }

  croak(msg: string) {
    throw new Error(`${msg} (${this.line}:${this.col})`);
  }
}
