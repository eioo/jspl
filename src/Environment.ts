export default class Environment {
  vars: {
    [key: string]: any;
  };

  constructor(public parent?: Environment) {
    this.vars = Object.create(parent ? parent.vars : null);
  }

  extend() {
    return new Environment(this);
  }

  lookup(name: string): Environment | void {
    // tslint:disable-next-line:no-this-assignment
    let scope: Environment | undefined = this;

    while (scope) {
      if (Object.prototype.hasOwnProperty.call(scope.vars, name)) {
        return scope;
      }

      scope = scope.parent;
    }
  }

  get(name: string) {
    if (name in this.vars) {
      return this.vars[name];
    }

    throw new Error(`Undefined variable ${name}`);
  }

  set(name: string, value: any) {
    const scope = this.lookup(name);

    if (!scope && this.parent) {
      throw new Error(`Undefined variable ${name}`);
    }

    return ((scope || this).vars[name] = value);
  }

  def(name: string, value: any) {
    return (this.vars[name] = value);
  }
}
