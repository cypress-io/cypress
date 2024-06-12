import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin storage', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('.getAllLocalStorage', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.visit('/fixtures/set-storage-on-multiple-origins.html')

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
  })

  it('.clearAllLocalStorage', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.visit('/fixtures/set-storage-on-multiple-origins.html')

      cy.clearAllLocalStorage()
      cy.getAllLocalStorage().should('deep.equal', {})
    })
  })

  it('.getAllSessionStorage', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.visit('/fixtures/set-storage-on-multiple-origins.html')

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
  })

  it('.clearAllSessionStorage', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.visit('/fixtures/set-storage-on-multiple-origins.html')

      cy.clearAllSessionStorage()
      cy.getAllSessionStorage().should('deep.equal', {})
    })
  })

  it('.clearLocalStorage()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('foo', 'bar')
        expect(win.localStorage.getItem('foo')).to.equal('bar')
      })

      cy.clearLocalStorage().should((localStorage) => {
        expect(localStorage.length).to.equal(0)
        expect(localStorage.getItem('foo')).to.be.null
      })
    })
  })

  context('#consoleProps', () => {
    let logs: Map<string, any>

    beforeEach(() => {
      logs = new Map()

      cy.on('log:changed', (attrs, log) => {
        logs.set(attrs.id, log)
      })
    })

    it('.clearLocalStorage()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.window().then((win) => {
          win.localStorage.setItem('foo', 'bar')
          expect(win.localStorage.getItem('foo')).to.equal('bar')
        })

        cy.clearLocalStorage()
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('clearLocalStorage', logs, 'foobar.com')

        expect(consoleProps.name).to.equal('clearLocalStorage')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Yielded).to.be.null
      })
    })
  })
})
