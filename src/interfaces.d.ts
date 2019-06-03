export interface IToken {
  type: string;
  value: string | number;
}

export interface IPrecedence {
  [key: string]: number;
}

export type ASTNode =
  | INumNode
  | IStringNode
  | IBooleanNode
  | IVariableNode
  | ILambdaNode
  | ICallNode
  | IIfNode
  | IAssignNode
  | IBinaryNode
  | IProgNode
  | ILetNode;

interface INumNode {
  type: 'num';
  value: number;
}

interface IStringNode {
  type: 'str';
  value: string;
}

interface IBooleanNode {
  type: 'bool';
  value: boolean;
}

interface IVariableNode {
  type: 'var';
  value: string;
}

interface ILambdaNode {
  type: 'lambda';
  vars: string[];
  body: ASTNode;
}

interface ICallNode {
  type: 'call';
  func: ASTNode;
  args: ASTNode[];
}

interface IIfNode {
  type: 'if';
  cond: ASTNode;
  then: ASTNode;
  else?: ASTNode;
}

interface IAssignNode {
  type: 'assign';
  operator: '=';
  left: ASTNode;
  right: ASTNode;
}

interface IBinaryNode {
  type: 'binary';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

interface IProgNode {
  type: 'prog';
  prog: ASTNode[];
}

interface ILetNode {
  type: 'let';
  vars: string[];
  body: ASTNode;
}
