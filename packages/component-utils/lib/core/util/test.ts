declare const Cypress: any

// Split out for unit testing purposes
export function key (): string {
  if (Cypress && Cypress.mocha) {
    const runner = Cypress.mocha.getRunner()

    if (runner && runner.test) {
      return (runner.test || '') + Math.random()
    }
  }

  return ''
}
