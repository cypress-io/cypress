declare namespace Chai {
  interface Assertion {
    matchSnapshot: {
      (name?: string)
      (replacers: object)
      (replacers: object, name?: string)
    }
    matchDeep: {
      (replacers: object, expected: object)
      (expected: object)
    }
  }
}
