const { assertLogLength } = require('../../support/utils')
const { _, Promise } = Cypress

describe('src/cy/commands/task', () => {
  context('#task', {
    taskTimeout: 2500,
  }, () => {
    beforeEach(() => {
      cy.stub(Cypress, 'backend').callThrough()
    })

    it('calls Cypress.backend(\'task\') with the right options', () => {
      Cypress.backend.resolves(null)

      cy.task('foo').then(() => {
        expect(Cypress.backend).to.be.calledWith('task', {
          task: 'foo',
          timeout: 2500,
          arg: undefined,
        })
      })
    })

    it('passes through arg', () => {
      Cypress.backend.resolves(null)

      cy.task('foo', { foo: 'foo' }).then(() => {
        expect(Cypress.backend).to.be.calledWith('task', {
          task: 'foo',
          timeout: 2500,
          arg: {
            foo: 'foo',
          },
        })
      })
    })

    it('really works', () => {
      cy.task('return:arg', 'works').should('eq', 'works')
    })

    it('returns the default value when no argument is given', () => {
      cy.task('arg:is:undefined').should('eq', 'arg was undefined')
    })

    describe('.log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
          this.logs.push(log)
        })

        Cypress.backend.resolves(null)

        return null
      })

      it('can turn off logging', () => {
        cy.task('foo', null, { log: false }).then(function () {
          const logs = _.filter(this.logs, (log) => {
            return log.get('name') === 'task'
          })

          expect(logs.length).to.eq(0)
        })
      })

      it('logs immediately before resolving', function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'task') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('message')).to.eq('foo')
          }
        })

        cy.task('foo').then(() => {
          if (!this.lastLog) {
            throw new Error('failed to log before resolving')
          }
        })
      })
    })

    describe('timeout', () => {
      beforeEach(() => {
        Cypress.backend.resolves(null)
      })

      it('defaults timeout to Cypress.config(taskTimeout)', () => {
        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.task('foo').then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.task('foo', null, { timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        cy.timeout(100)

        const clearTimeout = cy.spy(cy, 'clearTimeout')

        cy.on('task', () => {
          expect(clearTimeout).to.be.calledOnce
        })

        cy.task('foo').then(() => {
          expect(cy.timeout()).to.eq(100)
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 50,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'task') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('throws when task is absent', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.task()` must be passed a non-empty string as its 1st argument. You passed: ``.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/api/task')

          done()
        })

        cy.task()
      })

      it('throws when task isn\'t a string', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.task()` must be passed a non-empty string as its 1st argument. You passed: `3`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/api/task')

          done()
        })

        cy.task(3)
      })

      it('throws when task is an empty string', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.task()` must be passed a non-empty string as its 1st argument. You passed: ``.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/api/task')

          done()
        })

        cy.task('')
      })

      it('throws when the task errors', function (done) {
        Cypress.backend.rejects(new Error('task failed'))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')

          expect(err.message).to.include('`cy.task(\'foo\')` failed with the following error:')
          expect(err.message).to.include('> task failed')

          done()
        })

        cy.task('foo')
      })

      it('throws when task is not registered by plugin', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')

          expect(err.message).to.eq(`\`cy.task('bar')\` failed with the following error:\n\nThe task 'bar' was not handled in the setupNodeEvents method. The following tasks are registered: return:arg, cypress:env, arg:is:undefined, wait, create:long:file, check:screenshot:size\n\nFix this in your setupNodeEvents method here:\n${Cypress.config('configFile')}`)

          done()
        })

        cy.task('bar')
      })

      it('throws after timing out', function (done) {
        Cypress.backend.resolves(Promise.delay(250))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.task(\'foo\')` timed out after waiting `50ms`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/api/task')

          done()
        })

        cy.task('foo', null, { timeout: 50 })
      })

      it('logs once on error', function (done) {
        Cypress.backend.rejects(new Error('task failed'))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')

          done()
        })

        cy.task('foo')
      })

      it('can timeout from the backend\'s response', (done) => {
        const err = new Error('timeout')

        err.timedOut = true

        Cypress.backend.rejects(err)

        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.task(\'wait\')` timed out after waiting `100ms`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/api/task')

          done()
        })

        cy.task('wait', null, { timeout: 100 })
      })

      it('can really time out', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.task(\'wait\')` timed out after waiting `100ms`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/api/task')

          done()
        })

        cy.task('wait', null, { timeout: 100 })
      })
    })
  })
})
