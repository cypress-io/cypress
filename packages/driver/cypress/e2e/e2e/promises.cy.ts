// `console` is a property of the global scope rather than of `Window`, so the
// top frame has to be widened before spying on it
const topWindow = () => window.top as Window & typeof globalThis

// `_warn` is a Bluebird internal, so it is absent from Bluebird's public types
type PromiseInternals = typeof Cypress.Promise.prototype & {
  _warn (message: string, shouldUseOwnTrace?: boolean, promise?: unknown): void
}

describe('promises', () => {
  beforeEach(function () {
    this.warn = cy.spy(Cypress.Promise.prototype as PromiseInternals, '_warn')
  })

  afterEach(function () {
    expect(this.warn).not.to.be.calledOnce
  })

  it('warns when returning a promise and calling cypress commands', () => {
    const consoleWarn = cy.spy(topWindow().console, 'warn')

    const title = cy.state('runnable').fullTitle()

    return Cypress.Promise.delay(10)
    .then(() => {
      cy.wrap({})
      cy.wrap([])

      return cy.wrap('lol')
      .then(() => {
        const msg = consoleWarn.firstCall.args[0]

        expect(msg).to.include('Cypress detected that you returned a promise in a test, but also invoked one or more cy commands inside of that promise.')
        expect(msg).to.include(title)
        expect(msg).to.include('https://on.cypress.io/returning-promise-and-commands-in-test')

        expect(consoleWarn).to.be.calledOnce
      })
    })
  })

  it('warns when instantiating a promise and calling cypress commands', () => {
    const consoleWarn = cy.spy(topWindow().console, 'warn')

    const title = cy.state('runnable').fullTitle()

    return new Cypress.Promise((resolve) => {
      cy.wrap({})
      cy.wrap([])

      return cy.wrap('lol')
      .then(resolve)
    }).then(() => {
      const msg = consoleWarn.firstCall.args[0]

      expect(msg).to.include('Cypress detected that you returned a promise in a test, but also invoked one or more cy commands inside of that promise.')
      expect(msg).to.include(title)
      expect(msg).to.include('https://on.cypress.io/returning-promise-and-commands-in-test')

      expect(consoleWarn).to.be.calledOnce
    })
  })

  it('throws when returning a promise from a custom command', function (done) {
    const logs: any[] = []

    cy.on('log:added', (attrs, log) => {
      this.lastLog = log

      return logs.push(log)
    })

    cy.on('fail', (err) => {
      const { lastLog } = this

      expect(logs.length).to.eq(1)
      expect(lastLog.get('name')).to.eq('foo')
      expect(lastLog.get('error')).to.eq(err)

      expect(err.message).to.include('Cypress detected that you returned a promise from a command while also invoking one or more cy commands in that promise.')
      expect(err.message).to.include('> `cy.foo()`')
      expect(err.message).to.include('> `cy.wrap()`')
      expect(err.docsUrl).to.eq('https://on.cypress.io/returning-promise-and-commands-in-another-command')

      return done()
    })

    // @ts-expect-error - custom command is not added to the Chainable interface
    Cypress.Commands.add('foo', () => {
      return Cypress.Promise
      .delay(10)
      .then(() => {
        return cy.wrap({})
      })
    })

    // @ts-expect-error - custom command is not added to the Chainable interface
    return cy.foo()
  })

  it('throws when instantiating a promise from a custom command', function (done) {
    const logs: any[] = []

    cy.on('log:added', (attrs, log) => {
      this.lastLog = log

      return logs.push(log)
    })

    cy.on('fail', (err) => {
      const { lastLog } = this

      expect(logs.length).to.eq(1)
      expect(lastLog.get('name')).to.eq('foo')
      expect(lastLog.get('error')).to.eq(err)

      expect(err.message).to.include('Cypress detected that you returned a promise from a command while also invoking one or more cy commands in that promise.')
      expect(err.message).to.include('> `cy.foo()`')
      expect(err.message).to.include('> `cy.wrap()`')

      return done()
    })

    // @ts-expect-error - custom command is not added to the Chainable interface
    Cypress.Commands.add('foo', () => {
      return new Cypress.Promise((resolve) => {
        return cy.wrap({}).then(resolve)
      })
    })

    // @ts-expect-error - custom command is not added to the Chainable interface
    return cy.foo()
  })

  it('is okay to return promises from custom commands with no cy commands', () => {
    // @ts-expect-error - custom command is not added to the Chainable interface
    Cypress.Commands.add('foo', () => {
      return Cypress.Promise
      .delay(10)
    })

    // @ts-expect-error - custom command is not added to the Chainable interface
    return cy.foo()
  })

  it('can return a promise that throws on its own without warning', () => {
    return Cypress.Promise
    .delay(10)
    .then(() => {
      return cy.wrap({}).should('deep.eq', {})
    }).then((obj) => {
      expect(obj).to.deep.eq({})

      throw new Error('foo')
    }).catch(() => {})
  })

  it('can still fail cypress commands', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.eq('foo')

      return done()
    })

    Cypress.Promise
    .delay(10)
    .then(() => {
      return cy.wrap({}).then(() => {
        throw new Error('foo')
      })
    })
  })
})
