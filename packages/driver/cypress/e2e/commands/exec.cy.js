const { assertLogLength } = require('../../support/utils')
const { _, Promise } = Cypress

describe('src/cy/commands/exec', () => {
  const okResponse = { code: 0 }

  context('#exec', {
    execTimeout: 2500,
  }, () => {
    beforeEach(() => {
      // call through normally on everything
      cy.stub(Cypress, 'backend').log(false).callThrough()
    })

    it('sends privileged exec to backend with the right options', () => {
      Cypress.backend.resolves(okResponse)

      cy.exec('ls').then(() => {
        expect(Cypress.backend).to.be.calledWith('run:privileged', {
          args: ['8374177128052794'],
          commandName: 'exec',
          options: {
            cmd: 'ls',
            timeout: 2500,
            env: {},
          },
        })
      })
    })

    it('passes through environment variables', () => {
      Cypress.backend.resolves(okResponse)

      cy.exec('ls', { env: { FOO: 'foo' } }).then(() => {
        expect(Cypress.backend).to.be.calledWith('run:privileged', {
          args: ['8374177128052794', '6419589148408857'],
          commandName: 'exec',
          options: {
            cmd: 'ls',
            timeout: 2500,
            env: { FOO: 'foo' },
          },
        })
      })
    })

    it('works e2e', () => {
      // output is trimmed
      cy.exec('echo foo', { timeout: 20000 }).its('stdout').should('eq', 'foo')
    })

    describe('.log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
          this.logs.push(log)
        })

        return null
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        Cypress.backend.resolves(okResponse)

        cy.exec('ls', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        Cypress.backend.resolves(okResponse)

        cy.exec('ls', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog.get('name'), 'log name').to.eq('exec')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('logs immediately before resolving', function () {
        Cypress.backend.resolves(okResponse)

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'exec') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('message')).to.eq('ls')
          }
        })

        cy.exec('ls').then(() => {
          if (!this.lastLog) {
            throw new Error('failed to log before resolving')
          }
        })
      })
    })

    describe('timeout', () => {
      it('defaults timeout to Cypress.config(execTimeout)', () => {
        Cypress.backend.resolves(okResponse)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.exec('ls').then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        Cypress.backend.resolves(okResponse)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.exec('li', { timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        Cypress.backend.resolves(okResponse)

        cy.timeout(100)

        const clearTimeout = cy.spy(cy, 'clearTimeout')

        cy.on('exec', () => {
          expect(clearTimeout).to.be.calledOnce
        })

        cy.exec('ls').then(() => {
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
          if (attrs.name === 'exec') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('throws when cmd is absent', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.exec()` must be passed a non-empty string as its 1st argument. You passed: \'\'.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/exec')

          done()
        })

        cy.exec()
      })

      it('throws when cmd isn\'t a string', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.exec()` must be passed a non-empty string as its 1st argument. You passed: \'3\'.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/exec')

          done()
        })

        cy.exec(3)
      })

      it('throws when cmd is an empty string', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.exec()` must be passed a non-empty string as its 1st argument. You passed: \'\'.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/exec')

          done()
        })

        cy.exec('')
      })

      it('throws when the execution errors', function (done) {
        Cypress.backend.withArgs('run:privileged').rejects(new Error('exec failed'))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')

          expect(err.message).to.eq('`cy.exec(\'ls\')` failed with the following error:\n\n> "Error: exec failed"')
          expect(err.docsUrl).to.eq('https://on.cypress.io/exec')

          done()
        })

        cy.exec('ls')
      })

      it('throws after timing out', function (done) {
        Cypress.backend.withArgs('run:privileged').resolves(Promise.delay(250))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.exec(\'ls\')` timed out after waiting `50ms`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/exec')

          done()
        })

        cy.exec('ls', { timeout: 50 })
      })

      it('logs once on error', function (done) {
        Cypress.backend.withArgs('run:privileged').rejects(new Error('exec failed'))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')

          done()
        })

        cy.exec('ls')
      })

      it('can timeout from the backend\'s response', (done) => {
        const err = new Error('timeout')

        err.timedOut = true

        Cypress.backend.withArgs('run:privileged').rejects(err)

        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.exec(\'sleep 2\')` timed out after waiting `100ms`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/exec')

          done()
        })

        cy.exec('sleep 2', {
          timeout: 100,
        })
      })

      it('can really time out', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.exec(\'sleep 2\')` timed out after waiting `100ms`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/exec')

          done()
        })

        cy.exec('sleep 2', {
          timeout: 100,
        })
      })

      describe('when error code is non-zero', () => {
        it('throws error that includes useful information and exit code', (done) => {
          Cypress.backend.resolves({ code: 1 })

          cy.on('fail', (err) => {
            expect(err.message).to.contain('`cy.exec(\'ls\')` failed because the command exited with a non-zero code.\n\nPass `{failOnNonZeroExit: false}` to ignore exit code failures.')
            expect(err.message).to.contain('Code: 1')
            expect(err.docsUrl).to.contain('https://on.cypress.io/exec')

            done()
          })

          cy.exec('ls')
        })

        it('throws error that includes stderr if it exists and is non-empty', (done) => {
          Cypress.backend.resolves({ code: 1, stderr: 'error output', stdout: '' })

          cy.on('fail', (err) => {
            expect(err.message).to.contain('Stderr:\nerror output')
            expect(err.message).not.to.contain('Stdout')

            done()
          })

          cy.exec('ls')
        })

        it('throws error that includes stdout if it exists and is non-empty', (done) => {
          Cypress.backend.resolves({ code: 1, stderr: '', stdout: 'regular output' })

          cy.on('fail', (err) => {
            expect(err.message).to.contain('\nStdout:\nregular output')
            expect(err.message).not.to.contain('Stderr')

            done()
          })

          cy.exec('ls')
        })

        it('throws error that includes stdout and stderr if they exists and are non-empty', (done) => {
          Cypress.backend.resolves({ code: 1, stderr: 'error output', stdout: 'regular output' })

          cy.on('fail', (err) => {
            expect(err.message).to.contain('\nStdout:\nregular output\nStderr:\nerror output')

            done()
          })

          cy.exec('ls')
        })

        it('truncates the stdout and stderr in the error message', (done) => {
          Cypress.backend.resolves({
            code: 1,
            stderr: `${_.range(200).join()}stderr should be truncated`,
            stdout: `${_.range(200).join()}stdout should be truncated`,
          })

          cy.on('fail', (err) => {
            expect(err.message).not.to.contain('stderr should be truncated')
            expect(err.message).not.to.contain('stdout should be truncated')
            expect(err.message).to.contain('...')

            done()
          })

          cy.exec('ls')
        })

        it('can really fail', function (done) {
          cy.on('fail', () => {
            const { lastLog } = this

            const { Yielded } = lastLog.invoke('consoleProps').props

            // output is trimmed
            expect(Yielded).to.deep.eq({
              stdout: 'foo',
              stderr: '',
              code: 1,
            })

            done()
          })

          cy.exec('echo foo && exit 1')
        })

        describe('and failOnNonZeroExit is false', () => {
          it('does not error', () => {
            const response = { code: 1, stderr: 'error output', stdout: 'regular output' }

            Cypress.backend.resolves(response)

            cy
            .exec('ls', { failOnNonZeroExit: false })
            .should('deep.eq', response)
          })

          it('does not really fail', () => {
            cy.exec('echo foo && exit 1', {
              failOnNonZeroExit: false,
            })
          })
        })
      })
    })
  })
})
