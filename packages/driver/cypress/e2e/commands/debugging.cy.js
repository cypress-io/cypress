describe('src/cy/commands/debugging', () => {
  context('#debug', () => {
    beforeEach(function () {
      this.utilsLog = cy.stub(Cypress.utils, 'log')
    })

    it('does not change the subject', () => {
      cy.wrap({}).debug().then((subject) => {
        expect(subject).to.deep.eq({})
      })
    })

    it('logs current subject', () => {
      const obj = { foo: 'bar' }

      cy.wrap(obj).its('foo').debug().then(function () {
        expect(this.utilsLog).to.be.calledWithMatch('Current Subject: ', 'bar')
      })
    })

    it('logs previous command', () => {
      cy.wrap({}).debug().then(function () {
        expect(this.utilsLog).to.be.calledWithMatch('Command Name: ', 'wrap')
        expect(this.utilsLog).to.be.calledWithMatch('Command Args: ', [{}])
        expect(this.utilsLog).to.be.calledWithMatch('Current Subject: ', {})
      })
    })

    it('logs undefined on being parent', () => {
      cy.debug().then(function () {
        expect(this.utilsLog).to.be.calledWithMatch('Current Subject: ', undefined)

        expect(this.utilsLog).to.be.calledWithMatch('Command Name: ', undefined)
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'debug') {
            this.lastLog = log
          }
        })

        return null
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'debug') {
            this.hiddenLog = log
          }
        })

        cy.wrap([], { log: false })
        .debug({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'debug') {
            this.hiddenLog = log
          }
        })

        cy.wrap([], { log: false })
        .debug({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog.get('name'), 'log name').to.eq('debug')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })
    })
  })

  context('#pause', () => {
    beforeEach(function () {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'pause') {
          this.lastLog = log
        }
      })

      return null
    })

    it('can pause between each command and skips assertions', function () {
      let expected = false

      cy.once('paused', (name) => {
        // should be pending
        expect(this.lastLog.get('state')).to.eq('pending')

        expect(name).to.eq('wrap')

        cy.once('paused', (name) => {
          expected = true

          expect(name).to.eq('then')

          // resume the rest of the commands so this
          // test ends
          Cypress.emit('resume:all')
        })

        Cypress.emit('resume:next')
      })

      cy.pause().wrap({}).should('deep.eq', {}).then(function () {
        expect(expected).to.be.true

        // should be pending
        expect(this.lastLog.get('state')).to.eq('passed')

        // should no longer have onPaused
        expect(cy.state('onPaused')).to.be.null
      })
    })

    it('can pause in run mode with --headed and --no-exit', function () {
      let didPause = false

      Cypress.config('isInteractive', false)
      Cypress.config('browser').isHeaded = true
      Cypress.config('exit', false)

      cy.once('paused', (name) => {
        cy.once('paused', (name) => {
          didPause = true

          // resume the rest of the commands so this
          // test ends
          Cypress.emit('resume:all')
        })

        Cypress.emit('resume:next')
      })

      cy.pause().wrap({}).should('deep.eq', {}).then(function () {
        expect(didPause).to.be.true

        // should no longer have onPaused
        expect(cy.state('onPaused')).to.be.null
      })
    })
  })
})
