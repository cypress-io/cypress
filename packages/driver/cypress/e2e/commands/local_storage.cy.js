describe('src/cy/commands/local_storage', () => {
  context('#clearLocalStorage', () => {
    it('passes keys onto Cypress.LocalStorage.clear', () => {
      const clear = cy.spy(Cypress.LocalStorage, 'clear')

      cy.clearLocalStorage('foo').then(() => {
        expect(clear).to.be.calledWith('foo')
      })
    })

    it('sets the storages', () => {
      const {
        localStorage,
      } = window
      const remoteStorage = cy.state('window').localStorage

      const setStorages = cy.spy(Cypress.LocalStorage, 'setStorages')

      cy.clearLocalStorage().then(() => {
        expect(setStorages).to.be.calledWith(localStorage, remoteStorage)
      })
    })

    it('unsets the storages', () => {
      const unsetStorages = cy.spy(Cypress.LocalStorage, 'unsetStorages')

      cy.clearLocalStorage().then(() => {
        expect(unsetStorages).to.be.called
      })
    })

    it('sets subject to remote localStorage', () => {
      const ls = cy.state('window').localStorage

      cy.clearLocalStorage().then((remote) => {
        expect(remote).to.eq(ls)
      })
    })

    describe('test:before:run', () => {
      it('clears localStorage before each test run', () => {
        const clear = cy.spy(Cypress.LocalStorage, 'clear')

        Cypress.emit('test:before:run', {})
        if (Cypress.config('experimentalSessionAndOrigin')) {
          expect(clear).not.to.be.called
        } else {
          expect(clear).to.be.calledWith([])
        }
      })
    })

    describe('errors', () => {
      it('throws when being passed a non string or regexp', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.clearLocalStorage()` must be called with either a string or regular expression.')
          expect(err.docsUrl).to.include('https://on.cypress.io/clearlocalstorage')

          done()
        })

        // A number is used as an object will be considered as `options`
        cy.clearLocalStorage(1)
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
        })

        return null
      })

      it('ends immediately', () => {
        cy.clearLocalStorage().then(function () {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        cy.clearLocalStorage().then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })
    })

    describe('without log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
        })

        return null
      })

      it('log is disabled', () => {
        cy.clearLocalStorage('foo', { log: false }).then(function () {
          const { lastLog } = this

          expect(lastLog).to.be.undefined
        })
      })

      it('log is disabled without key', () => {
        cy.clearLocalStorage({ log: false }).then(function () {
          const { lastLog } = this

          expect(lastLog).to.be.undefined
        })
      })
    })
  })
})
