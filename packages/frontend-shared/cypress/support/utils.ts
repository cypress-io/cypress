export function logInternal<T> (name: string | Partial<Cypress.LogConfig>, cb: (log: Cypress.Log | undefined) => Cypress.Chainable<T>, opts: Partial<Cypress.Loggable> = {}): Cypress.Chainable<T> {
  const _log = typeof name === 'string'
    ? Cypress.log({ name, message: '' })
    : Cypress.log(name)

  return cb(_log).then<T>((val) => {
    _log?.end()

    return val
  })
}
