import { assertLogLength } from '../../../support/utils'

// @ts-ignore / session support is needed for visiting about:blank between tests
describe('multi-domain yields', { experimentalSessionSupport: true }, () => {
  let logs: any = []

  beforeEach(() => {
    logs = []

    cy.on('log:added', (attrs, log) => {
      logs.push(log)
    })

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  it('yields a value', () => {
    cy.switchToDomain('foobar.com', () => {
      cy
      .get('[data-cy="dom-check"]')
      .invoke('text')
    }).should('equal', 'From a secondary domain')
  })

  it('yields the cy value even if a return is present', () => {
    cy.switchToDomain('foobar.com', () => {
      cy
      .get('[data-cy="dom-check"]')
      .invoke('text')

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve('text')
        }, 50)
      })
    }).should('equal', 'From a secondary domain')
  })

  it('errors if a cy command is present and it returns a sync value', (done) => {
    cy.on('fail', (err) => {
      assertLogLength(logs, 5)
      expect(logs[4].get('error')).to.eq(err)
      expect(err.message).to.include('`cy.switchToDomain()` failed because you are mixing up async and sync code.')

      done()
    })

    cy.switchToDomain('foobar.com', () => {
      cy
      .get('[data-cy="dom-check"]')
      .invoke('text')

      return 'text'
    })
  })

  it('yields synchronously', () => {
    cy.switchToDomain('foobar.com', () => {
      return 'From a secondary domain'
    }).should('equal', 'From a secondary domain')
  })

  it('yields asynchronously', () => {
    cy.switchToDomain('foobar.com', () => {
      return new Promise((resolve: (val: string) => any, reject) => {
        setTimeout(() => {
          resolve('From a secondary domain')
        }, 50)
      })
    }).should('equal', 'From a secondary domain')
  })

  it('succeeds if subject cannot be serialized and is not accessed synchronously', () => {
    cy.switchToDomain('foobar.com', () => {
      return {
        symbol: Symbol(''),
      }
    }).then((obj) => {
      return 'object not accessed'
    }).should('equal', 'object not accessed')
  })

  it('throws if subject cannot be serialized and is accessed synchronously', (done) => {
    cy.on('fail', (err) => {
      assertLogLength(logs, 6)
      expect(logs[5].get('error')).to.eq(err)
      expect(err.message).to.include('`cy.switchToDomain()` could not serialize the subject due to one of its properties not being supported by the structured clone algorithm.')

      done()
    })

    cy.switchToDomain('foobar.com', () => {
      return {
        symbol: Symbol(''),
      }
    }).then((obj) => {
      // @ts-ignore
      return obj.symbol // This will fail accessing the symbol
    })
  })

  it('succeeds if subject cannot be serialized and is not accessed', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('[data-cy="dom-check"]')
    })
    .then(() => {
      return 'object not accessed'
    })
    .should('equal', 'object not accessed')
  })

  it('throws if subject cannot be serialized and is accessed', (done) => {
    cy.on('fail', (err) => {
      assertLogLength(logs, 6)
      expect(logs[5].get('error')).to.eq(err)
      expect(err.message).to.include('`cy.switchToDomain()` could not serialize the subject due to one of its properties not being supported by the structured clone algorithm.')

      done()
    })

    cy.switchToDomain('foobar.com', () => {
      cy.get('[data-cy="dom-check"]')
    })
    .then((subject) => subject.text())
    .should('equal', 'From a secondary domain')
  })

  it('throws if an object contains a function', (done) => {
    cy.on('fail', (err) => {
      assertLogLength(logs, 6)
      expect(logs[5].get('error')).to.eq(err)
      expect(err.message).to.include('`cy.switchToDomain()` could not serialize the subject due to one of its properties not being supported by the structured clone algorithm.')

      done()
    })

    cy.switchToDomain('foobar.com', () => {
      cy.wrap({
        key: () => {
          return 'whoops'
        },
      })
    })
    .then((subject) => subject.key())
    .should('equal', 'whoops')
  })

  it('throws if an object contains a symbol', (done) => {
    cy.on('fail', (err) => {
      assertLogLength(logs, 6)
      expect(logs[5].get('error')).to.eq(err)
      expect(err.message).to.include('`cy.switchToDomain()` could not serialize the subject due to one of its properties not being supported by the structured clone algorithm.')

      done()
    })

    cy.switchToDomain('foobar.com', () => {
      cy.wrap({
        key: Symbol('whoops'),
      })
    })
    .should('equal', undefined)
  })

  it('throws if an object is a function', (done) => {
    cy.on('fail', (err) => {
      assertLogLength(logs, 6)
      expect(logs[5].get('error')).to.eq(err)
      expect(err.message).to.include('`cy.switchToDomain()` could not serialize the subject due to functions not being supported by the structured clone algorithm.')

      done()
    })

    cy.switchToDomain('foobar.com', () => {
      cy.wrap(() => {
        return 'text'
      })
    })
    .then((obj) => {
      // @ts-ignore
      obj()
    })
  })

  it('throws if an object is a symbol', (done) => {
    cy.on('fail', (err) => {
      assertLogLength(logs, 6)
      expect(logs[5].get('error')).to.eq(err)
      expect(err.message).to.include('`cy.switchToDomain()` could not serialize the subject due to symbols not being supported by the structured clone algorithm.')

      done()
    })

    cy.switchToDomain('foobar.com', () => {
      cy.wrap(Symbol('symbol'))
    })
    .should('equal', 'symbol')
  })

  // NOTE: Errors can only be serialized on chromium browsers.
  it('yields an error if an object contains an error', (done) => {
    const isChromium = Cypress.isBrowser({ family: 'chromium' })

    cy.on('fail', (err) => {
      if (!isChromium) {
        assertLogLength(logs, 6)
        expect(logs[5].get('error')).to.eq(err)
        expect(err.message).to.include('`cy.switchToDomain()` could not serialize the subject due to one of its properties not being supported by the structured clone algorithm.')
      }

      done()
    })

    cy.switchToDomain('foobar.com', () => {
      cy.wrap({
        key: new Error('Boom goes the dynamite'),
      })
    })
    .its('key.message')
    .should('equal', 'Boom goes the dynamite').then(() => {
      done()
    })
  })

  it('yields an object containing valid types', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.wrap({
        array: [
          1,
          2,
        ],
        undefined,
        bool: true,
        null: null,
        number: 12,
        object: {
          key: 'key',
        },
        string: 'string',
      })
    })
    .should('deep.equal', {
      array: [
        1,
        2,
      ],
      undefined,
      bool: true,
      null: null,
      number: 12,
      object: {
        key: 'key',
      },
      string: 'string',
    })
  })
})
