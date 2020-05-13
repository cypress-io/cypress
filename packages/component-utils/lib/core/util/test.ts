declare const Cypress: any

/**
 * Get a key for a specific test, by name
 */
export function key (): string {
  // Split out for unit testing purposes
  if (Cypress && Cypress.mocha) {
    const runner = Cypress.mocha.getRunner()

    if (runner && runner.test) {
      return (runner.test || '') + Math.random()
    }
  }

  return ''
}
