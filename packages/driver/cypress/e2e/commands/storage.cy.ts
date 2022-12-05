import { assertLogLength } from '../../support/utils'

describe('src/cy/commands/storage', () => {
  let logs: Cypress.Log[]

  beforeEach(() => {
    logs = []

    cy.on('log:added', (attrs, log: Cypress.Log) => {
      logs.push(log)
    })
  })

  context('#getAllLocalStorage', () => {
    beforeEach(() => {
      cy.visit('/fixtures/set-storage-on-multiple-origins.html')
    })

    it('gets local storage from all origins', () => {
      cy.getAllLocalStorage().should('deep.equal', {
        'http://localhost:3500': {
          key1: 'value1',
          key2: 'value2',
        },
        'http://www.foobar.com:3500': {
          key3: 'value3',
          key4: 'value4',
        },
        'http://other.foobar.com:3500': {
          key5: 'value5',
          key6: 'value6',
        },
        'http://barbaz.com:3500': {
          key7: 'value7',
          key8: 'value8',
        },
      })
    })

    it('logs once', () => {
      cy.getAllLocalStorage().then(() => {
        assertLogLength(logs, 2)
        expect(logs[0].get('name')).to.eq('visit')
        expect(logs[1].get('name')).to.eq('getAllLocalStorage')
      })
    })

    it('does not log when log: false', () => {
      cy.getAllLocalStorage({ log: false }).then(() => {
        assertLogLength(logs, 1)
        expect(logs[0].get('name')).to.eq('visit')
      })
    })

    it('consoleProps includes the storage yielded', () => {
      cy.getAllLocalStorage().then(() => {
        const consoleProps = logs[1].get('consoleProps')()

        expect(consoleProps).to.deep.equal({
          Command: 'getAllLocalStorage',
          Yielded: {
            'http://localhost:3500': {
              key1: 'value1',
              key2: 'value2',
            },
            'http://www.foobar.com:3500': {
              key3: 'value3',
              key4: 'value4',
            },
            'http://other.foobar.com:3500': {
              key5: 'value5',
              key6: 'value6',
            },
            'http://barbaz.com:3500': {
              key7: 'value7',
              key8: 'value8',
            },
          },
        })
      })
    })
  })

  context('#clearAllLocalStorage', () => {
    beforeEach(() => {
      cy.visit('/fixtures/set-storage-on-multiple-origins.html')
    })

    it('clears local storage for all origins', () => {
      cy.clearAllLocalStorage()
      cy.getAllLocalStorage().should('deep.equal', {})
    })

    it('logs once', () => {
      cy.clearAllLocalStorage().then(() => {
        assertLogLength(logs, 2)
        expect(logs[0].get('name')).to.eq('visit')
        expect(logs[1].get('name')).to.eq('clearAllLocalStorage')
      })
    })

    it('does not log when log: false', () => {
      cy.clearAllLocalStorage({ log: false }).then(() => {
        assertLogLength(logs, 1)
        expect(logs[0].get('name')).to.eq('visit')
      })
    })
  })

  context('#getAllSessionStorage', () => {
    beforeEach(() => {
      cy.visit('/fixtures/set-storage-on-multiple-origins.html')
    })

    it('gets local storage from all origins', () => {
      cy.getAllSessionStorage().should('deep.equal', {
        'http://localhost:3500': {
          key11: 'value11',
          key12: 'value12',
        },
        'http://www.foobar.com:3500': {
          key13: 'value13',
          key14: 'value14',
        },
        'http://other.foobar.com:3500': {
          key15: 'value15',
          key16: 'value16',
        },
        'http://barbaz.com:3500': {
          key17: 'value17',
          key18: 'value18',
        },
      })
    })

    it('logs once', () => {
      cy.getAllSessionStorage().then(() => {
        assertLogLength(logs, 2)
        expect(logs[0].get('name')).to.eq('visit')
        expect(logs[1].get('name')).to.eq('getAllSessionStorage')
      })
    })

    it('does not log when log: false', () => {
      cy.getAllSessionStorage({ log: false }).then(() => {
        assertLogLength(logs, 1)
        expect(logs[0].get('name')).to.eq('visit')
      })
    })

    it('consoleProps includes the storage yielded', () => {
      cy.getAllSessionStorage().then(() => {
        const consoleProps = logs[1].get('consoleProps')()

        expect(consoleProps).to.deep.equal({
          Command: 'getAllSessionStorage',
          Yielded: {
            'http://localhost:3500': {
              key11: 'value11',
              key12: 'value12',
            },
            'http://www.foobar.com:3500': {
              key13: 'value13',
              key14: 'value14',
            },
            'http://other.foobar.com:3500': {
              key15: 'value15',
              key16: 'value16',
            },
            'http://barbaz.com:3500': {
              key17: 'value17',
              key18: 'value18',
            },
          },
        })
      })
    })
  })

  context('#clearAllSessionStorage', () => {
    beforeEach(() => {
      cy.visit('/fixtures/set-storage-on-multiple-origins.html')
    })

    it('clears session storage for all origins', () => {
      cy.clearAllSessionStorage()
      cy.getAllSessionStorage().should('deep.equal', {})
    })

    it('logs once', () => {
      cy.clearAllSessionStorage().then(() => {
        assertLogLength(logs, 2)
        expect(logs[0].get('name')).to.eq('visit')
        expect(logs[1].get('name')).to.eq('clearAllSessionStorage')
      })
    })

    it('does not log when log: false', () => {
      cy.clearAllSessionStorage({ log: false }).then(() => {
        assertLogLength(logs, 1)
        expect(logs[0].get('name')).to.eq('visit')
      })
    })
  })

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

      const setStorages = cy.spy<InternalCypress.LocalStorage>(Cypress.LocalStorage as InternalCypress.LocalStorage, 'setStorages')

      cy.clearLocalStorage().then(() => {
        expect(setStorages).to.be.calledWith(localStorage, remoteStorage)
      })
    })

    it('unsets the storages', () => {
      const unsetStorages = cy.spy<InternalCypress.LocalStorage>(Cypress.LocalStorage as InternalCypress.LocalStorage, 'unsetStorages')

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
        expect(clear).not.to.be.called
      })
    })

    describe('errors', () => {
      it('throws when being passed a non string or regexp', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.clearLocalStorage()` must be called with either a string or regular expression.')
          expect(err.docsUrl).to.include('https://on.cypress.io/clearlocalstorage')

          done()
        })

        // @ts-expect-error
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
