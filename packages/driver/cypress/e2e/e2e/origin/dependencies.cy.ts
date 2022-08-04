describe('cy.origin dependencies', () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('works with an arrow function', () => {
    cy.origin('http://foobar.com:3500', () => {
      const lodash = Cypress.require('lodash')
      const dayjs = Cypress.require('dayjs')

      expect(lodash.get({ foo: 'foo' }, 'foo')).to.equal('foo')
      expect(dayjs('2022-07-29 12:00:00').format('MMMM D, YYYY')).to.equal('July 29, 2022')

      cy.log('command log')
    })
  })

  it('works with a function expression', () => {
    cy.origin('http://foobar.com:3500', function () {
      const lodash = Cypress.require('lodash')

      expect(lodash.get({ foo: 'foo' }, 'foo')).to.equal('foo')
    })
  })

  // FIXME: can this be made to work?
  it.skip('works with the function assigned to a variable', () => {
    const originCb = () => {
      const lodash = Cypress.require('lodash')

      expect(lodash.get({ foo: 'foo' }, 'foo')).to.equal('foo')
    }

    cy.origin('http://foobar.com:3500', originCb)
  })

  it('works with options object + args', () => {
    cy.origin('http://foobar.com:3500', { args: ['arg1'] }, ([arg1]) => {
      const lodash = Cypress.require('lodash')

      expect(lodash.get({ foo: 'foo' }, 'foo')).to.equal('foo')
      expect(arg1).to.equal('arg1')
    })
  })

  // FIXME: import() returns a promise that doesn't resolve
  it.skip('works with import() instead of require()', () => {
    cy.origin('http://foobar.com:3500', () => {
      const lodash = import('lodash')

      expect(lodash.get({ foo: 'foo' }, 'foo')).to.equal('foo')
    })
  })

  it('works with a yielded value', () => {
    cy.origin('http://foobar.com:3500', () => {
      const lodash = Cypress.require('lodash')

      expect(lodash.get({ foo: 'foo' }, 'foo')).to.equal('foo')

      cy.wrap('yielded value')
    })
    .should('equal', 'yielded value')
  })

  it('works with a returned value', () => {
    cy.origin('http://foobar.com:3500', () => {
      const lodash = Cypress.require('lodash')

      expect(lodash.get({ foo: 'foo' }, 'foo')).to.equal('foo')

      return 'returned value'
    })
    .should('equal', 'returned value')
  })

  it('works with multiple cy.origin calls', () => {
    cy.origin('http://foobar.com:3500', () => {
      const lodash = Cypress.require('lodash')

      expect(lodash.get({ foo: 'foo' }, 'foo')).to.equal('foo')

      cy.get('[data-cy="cross-origin-tertiary-link"]').click()
    })

    cy.origin('http://idp.com:3500', () => {
      const dayjs = Cypress.require('dayjs')

      expect(dayjs('2022-07-29 12:00:00').format('MMMM D, YYYY')).to.equal('July 29, 2022')
    })
  })

  it('works with a relative esm dependency', () => {
    cy.origin('http://foobar.com:3500', () => {
      const { add } = Cypress.require('./dependencies.support-esm')

      expect(add(1, 2)).to.equal(3)
    })
  })

  it('works with a relative commonjs dependency', () => {
    cy.origin('http://foobar.com:3500', () => {
      const { add } = Cypress.require('./dependencies.support-commonjs')

      expect(add(1, 2)).to.equal(3)
    })
  })

  it('works with args passed to require result', () => {
    const args = ['some string']

    cy.origin('http://foobar.com:3500', { args }, ([arg1]) => {
      const result = Cypress.require('./dependencies.support-commonjs')(arg1)

      expect(result).to.equal('some_string')
    })
  })

  it.only('fails appropriately when dependency is invalid', () => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('Cannot find module')
    })

    cy.origin('http://foobar.com:3500', () => {
      Cypress.require('./does-not-exist')
    })
  })

  // Test cases
  // - with syntax errors
  // - error if using require w/o webpack-preprocessor
  //   -> define Cypress.require and have it error
  // - a different file type (use types, jsx, tsx, etc)
  // - source maps?
  // TODO:
  // - types for Cypress.require
})
