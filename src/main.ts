import Environment from './Environment';
import { evaluate } from './evaluate';
import InputStream from './InputStream';
import Parser from './Parser';
import TokenStream from './TokenStream';

const code = `
print_range = lambda(a, b) if a <= b {
  print(a);
  if a + 1 <= b {
    print(", ");
    print_range(a + 1, b);
  } else println("");
};
print_range(1, 10);
`;

const inputStream = new InputStream(code);
const tokenStream = new TokenStream(inputStream);
const parser = new Parser(tokenStream);
const ast = parser.parse();

const globalEnv = new Environment();

globalEnv.def('print', (txt: string) => {
  if (typeof window === 'undefined') {
    process.stdout.write(txt.toString());
  } else {
    console.log(txt);
  }
});

globalEnv.def('println', (txt: string) => {
  console.log(txt);
});

globalEnv.def('log', (txt: string) => {
  console.log(new Date().toLocaleTimeString(), txt);
});

evaluate(ast, globalEnv);
