export class Foo {
  private name: string

  constructor (name: string) {
    this.name = name
  }

  public get hollaAt () {
    return this.name
  }
}

export function Bar () {}

class Baz extends Foo {
  public override get hollaAt () {
    return 'BAZ!'
  }
}

export default Baz
