import { assertLogLength } from '../../support/utils'

describe('src/cy/commands/storage', () => {
  let logs

  beforeEach(() => {
    logs = []

    cy.on('log:added', (attrs, log) => {
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

    it('retries until an assertion on asynchronously-set storage passes', () => {
      cy.window().then((win) => {
        setTimeout(() => {
          win.localStorage.setItem('asyncKey', 'asyncValue')
        }, 250)
      })

      cy.getAllLocalStorage().should((storage) => {
        expect(storage['http://localhost:3500']).to.have.property('asyncKey', 'asyncValue')
      })
    })

    // chained through .its() to exercise the background re-read that feeds retries
    it('retries through a chained query until asynchronously-set storage passes', () => {
      cy.window().then((win) => {
        setTimeout(() => {
          win.localStorage.setItem('asyncKey', 'asyncValue')
        }, 250)
      })

      // 'http://localhost:3500' has no `.`, so .its() treats it as a single key
      cy.getAllLocalStorage()
      .its('http://localhost:3500')
      .should('have.property', 'asyncKey', 'asyncValue')
    })

    it('times out with a retry error when the assertion never passes', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('Timed out retrying after 100ms')

        done()
      })

      cy.getAllLocalStorage({ timeout: 100 }).should('have.property', 'http://does-not-exist.com:3500')
    })

    it('logs once', () => {
      cy.getAllLocalStorage().then(() => {
        assertLogLength(logs, 2)
        expect(logs[0].get('name')).to.eq('visit')
        expect(logs[1].get('name')).to.eq('getAllLocalStorage')
        expect(logs[1].get('hidden')).to.be.false
      })
    })

    it('can turn off logging when protocol is disabled', function () {
      cy.state('isProtocolEnabled', false)
      cy.on('_log:added', (attrs, log) => {
        this.hiddenLog = log
      })

      cy.getAllLocalStorage({ log: false }).then(() => {
        const { hiddenLog } = this

        assertLogLength(logs, 1)
        expect(logs[0].get('name')).to.eq('visit')

        expect(hiddenLog).to.be.undefined
      })
    })

    it('can send hidden log when protocol is enabled', function () {
      cy.state('isProtocolEnabled', true)
      cy.on('_log:added', (attrs, log) => {
        this.hiddenLog = log
      })

      cy.getAllLocalStorage({ log: false }).then(() => {
        const { hiddenLog } = this

        assertLogLength(logs, 1)
        expect(logs[0].get('name')).to.eq('visit')

        expect(hiddenLog.get('name')).to.eq('getAllLocalStorage')
        expect(hiddenLog.get('hidden')).to.be.true
        expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
      })
    })

    it('consoleProps includes the storage yielded', () => {
      cy.getAllLocalStorage().then(() => {
        const consoleProps = logs[1].get('consoleProps')()

        expect(consoleProps).to.deep.equal({
          name: 'getAllLocalStorage',
          type: 'command',
          props: {
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
        expect(logs[1].get('hidden')).to.be.false
      })
    })

    it('can turn off logging when protocol is disabled', function () {
      cy.state('isProtocolEnabled', false)
      cy.on('_log:added', (attrs, log) => {
        this.hiddenLog = log
      })

      cy.clearAllLocalStorage({ log: false }).then(() => {
        const { hiddenLog } = this

        assertLogLength(logs, 1)
        expect(logs[0].get('name')).to.eq('visit')

        expect(hiddenLog).to.be.undefined
      })
    })

    it('can send hidden log when protocol is enabled', function () {
      cy.state('isProtocolEnabled', true)
      cy.on('_log:added', (attrs, log) => {
        this.hiddenLog = log
      })

      cy.clearAllLocalStorage({ log: false }).then(() => {
        const { hiddenLog } = this

        assertLogLength(logs, 1)
        expect(logs[0].get('name')).to.eq('visit')

        expect(hiddenLog.get('name')).to.eq('clearAllLocalStorage')
        expect(hiddenLog.get('hidden')).to.be.true
        expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
      })
    })
  })

  context('#getAllSessionStorage', () => {
    beforeEach(() => {
      cy.visit('/fixtures/set-storage-on-multiple-origins.html')
    })

    it('gets session storage from all origins', () => {
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

    it('retries until an assertion on asynchronously-set storage passes', () => {
      cy.window().then((win) => {
        setTimeout(() => {
          win.sessionStorage.setItem('asyncKey', 'asyncValue')
        }, 250)
      })

      cy.getAllSessionStorage().should((storage) => {
        expect(storage['http://localhost:3500']).to.have.property('asyncKey', 'asyncValue')
      })
    })

    // chained through .its() to exercise the background re-read that feeds retries
    it('retries through a chained query until asynchronously-set storage passes', () => {
      cy.window().then((win) => {
        setTimeout(() => {
          win.sessionStorage.setItem('asyncKey', 'asyncValue')
        }, 250)
      })

      // 'http://localhost:3500' has no `.`, so .its() treats it as a single key
      cy.getAllSessionStorage()
      .its('http://localhost:3500')
      .should('have.property', 'asyncKey', 'asyncValue')
    })

    it('times out with a retry error when the assertion never passes', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('Timed out retrying after 100ms')

        done()
      })

      cy.getAllSessionStorage({ timeout: 100 }).should('have.property', 'http://does-not-exist.com:3500')
    })

    // a trailing background read from the first command can overlap the second;
    // each command must still yield only its own storage type
    it('does not cross-contaminate back-to-back local and session storage reads', () => {
      cy.window().then((win) => {
        setTimeout(() => {
          win.localStorage.setItem('asyncLocal', 'localValue')
          win.sessionStorage.setItem('asyncSession', 'sessionValue')
        }, 250)
      })

      cy.getAllLocalStorage().should((storage) => {
        expect(storage['http://localhost:3500']).to.have.property('asyncLocal', 'localValue')
        expect(storage['http://localhost:3500']).to.not.have.property('asyncSession')
      })

      cy.getAllSessionStorage().should((storage) => {
        expect(storage['http://localhost:3500']).to.have.property('asyncSession', 'sessionValue')
        expect(storage['http://localhost:3500']).to.not.have.property('asyncLocal')
      })
    })

    it('logs once', () => {
      cy.getAllSessionStorage().then(() => {
        assertLogLength(logs, 2)
        expect(logs[0].get('name')).to.eq('visit')
        expect(logs[1].get('name')).to.eq('getAllSessionStorage')
        expect(logs[1].get('hidden')).to.be.false
      })
    })

    it('can turn off logging when protocol is disabled', function () {
      cy.state('isProtocolEnabled', false)
      cy.on('_log:added', (attrs, log) => {
        this.hiddenLog = log
      })

      cy.getAllSessionStorage({ log: false }).then(() => {
        const { hiddenLog } = this

        assertLogLength(logs, 1)
        expect(logs[0].get('name')).to.eq('visit')

        expect(hiddenLog).to.be.undefined
      })
    })

    it('can send hidden log when protocol is enabled', function () {
      cy.state('isProtocolEnabled', true)
      cy.on('_log:added', (attrs, log) => {
        this.hiddenLog = log
      })

      cy.getAllSessionStorage({ log: false }).then(() => {
        const { hiddenLog } = this

        assertLogLength(logs, 1)
        expect(logs[0].get('name')).to.eq('visit')

        expect(hiddenLog.get('name')).to.eq('getAllSessionStorage')
        expect(hiddenLog.get('hidden')).to.be.true
        expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
      })
    })

    it('consoleProps includes the storage yielded', () => {
      cy.getAllSessionStorage().then(() => {
        const consoleProps = logs[1].get('consoleProps')()

        expect(consoleProps).to.deep.equal({
          name: 'getAllSessionStorage',
          type: 'command',
          props: {
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
        expect(logs[1].get('hidden')).to.be.false
      })
    })

    it('can turn off logging when protocol is disabled', function () {
      cy.state('isProtocolEnabled', false)
      cy.on('_log:added', (attrs, log) => {
        this.hiddenLog = log
      })

      cy.clearLocalStorage('foo', { log: false }).then(() => {
        const { hiddenLog } = this

        assertLogLength(logs, 1)
        expect(logs[0].get('name')).to.eq('visit')

        expect(hiddenLog).to.be.undefined
      })
    })

    it('can send hidden log when protocol is enabled', function () {
      cy.state('isProtocolEnabled', true)
      cy.on('_log:added', (attrs, log) => {
        this.hiddenLog = log
      })

      cy.clearLocalStorage('foo', { log: false }).then(() => {
        const { hiddenLog } = this

        assertLogLength(logs, 1)
        expect(logs[0].get('name')).to.eq('visit')

        expect(hiddenLog.get('name')).to.eq('clearLocalStorage')
        expect(hiddenLog.get('hidden')).to.be.true
        expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
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

        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })
      })

      it('can turn off logging when protocol is disabled', function () {
        cy.state('isProtocolEnabled', false)
        cy.clearLocalStorage('foo', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', function () {
        cy.state('isProtocolEnabled', true)
        cy.clearLocalStorage('foo', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined

          expect(hiddenLog.get('name'), 'log name').to.eq('clearLocalStorage')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('log is disabled without key', () => {
        cy.state('isProtocolEnabled', false)
        cy.clearLocalStorage({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })
    })
  })
})
