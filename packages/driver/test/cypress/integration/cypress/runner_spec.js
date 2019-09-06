/* eslint-disable mocha/handle-done-callback */

const pending = []

const throwMetaError = (mes) => {
  const err = new Error(mes)

  err.name = 'MetaError'
  throw err
}

Cypress.on('test:after:run', (test) => {
  if (test.state === 'pending') {
    return pending.push(test)
  }
})

describe('src/cypress/runner', () => {
  it('handles "double quotes" in test name', (done) => {
    cy.once('log:added', (log) => {
      expect(log.hookName).to.equal('test')

      return done()
    })

    return cy.wrap({})
  })

  context('pending tests', () => {
    it('is not pending', () => {})

    it('is pending 1')

    it('is pending 2')

    it('has 2 pending tests', () => {
      expect(pending).to.have.length(2)

      expect(pending[0].title).to.eq('is pending 1')

      expect(pending[1].title).to.eq('is pending 2')
    })
  })

  context('async timeouts', () => {
    let lastTimeout = null
    const runner = Cypress.mocha.getRunner()

    const throwAfter = (n) => {
      return setTimeout(() => {
        throwMetaError(`The test did not time out before ${n} millis`)
      }, n)
    }

    const getTest = (r) => r && r.ctx.currentTest || r

    beforeEach(() => {

      // tt[cy.state('runnable').title]throwAfter(1000)

      lastTimeout = throwAfter(300)

      runner.once('fail', (r) => {
        const runnable = cy.state('runnable')
        const test = getTest(runnable)

        if (test.err.name === 'Uncaught MetaError') {
          test.err.message = test.err.message.split('\nThis error originated from')[0]

          return
        }

        expect(r.err.message).to.contain('Timed out after')

        test.error = null
        test.state = 'passed'

        // .error = null
        // debugger
        // debugger

        return false
      })
    })

    afterEach(() => {
      clearTimeout(lastTimeout)
    })

    it('can timeout async test', function (done) {
      this.timeout(100)
    })

    it('can timeout async test after cypress command', function (done) {
      this.timeout(100)
      cy.wait(0)
    })

    it('defaults to 4000 mocha timeout for tests', function () {
      expect(this.timeout()).eq(4000)
    })

    describe('hooks can timeout and share timeout with test', function () {
      beforeEach((done) => {
        this.ctx.test.timeout(100)

        // expect(this.timeout()).eq(100)
      })

      it('should timeout on hook', () => {})
    })

    describe('hooks can timeout and share timeout with test after cypress command', function () {
      beforeEach((done) => {
        cy.wait(0)
        this.ctx.test.timeout(100)

        // expect(this.timeout()).eq(2000)
      })

      it('should timeout on hook', () => {})
    })
  })
})
