const { $, Promise } = Cypress
const lodash = require('lodash')

describe('driver/src/cypress/index', () => {
  let CypressInstance

  beforeEach(function () {
    cy.stub(Promise, 'config')

    CypressInstance = Cypress.$Cypress.create({})
  })

  context('$Cypress', () => {
    it('is attached but not global', () => {
      expect(window.$Cypress).to.be.undefined
      expect(window.top.$Cypress).to.be.undefined
    })
  })

  context('$', () => {
    afterEach(() => {
      delete Cypress.$.expr[':'].foo
    })

    // https://github.com/cypress-io/cypress/issues/2830
    it('exposes expr', () => {
      expect(Cypress.$).to.have.property('expr')

      Cypress.$.expr[':'].foo = (elem) => {
        return Boolean(elem.getAttribute('foo'))
      }

      const $foo = $('<div foo=\'bar\'>foo element</div>').appendTo(cy.$$('body'))

      cy.get(':foo').then(($el) => {
        expect($el.get(0)).to.eq($foo.get(0))
      })
    })
  })

  context('_', () => {
    it('exposes lodash methods', () => {
      expect(Object.getOwnPropertyNames(Cypress._)).to.include.members(Object.getOwnPropertyNames(lodash))
    })

    it('has same lodash capitalize method', () => {
      // https://github.com/cypress-io/cypress/issues/7222
      expect(Cypress._.capitalize('FOO BAR')).to.eq(lodash.capitalize('FOO BAR'))
    })
  })

  context('#backend', () => {
    it('sets __stackCleaned__ on errors', function () {
      cy.stub(CypressInstance, 'emit')
      .withArgs('backend:request')
      .yieldsAsync({
        error: {
          name: 'Error',
          message: 'msg',
          stack: 'stack',
        },
      })

      return CypressInstance.backend('foo')
      .catch((err) => {
        expect(err.backend).to.be.true

        expect(err.stack).not.to.include('From previous event')
      })
    })

    // https://github.com/cypress-io/cypress/issues/4346
    it('can complete if a circular reference is sent', () => {
      const foo = {
        bar: {},
      }

      foo.bar.baz = foo

      return Cypress.backend('foo', foo)
      .then(() => {
        throw new Error('should not reach')
      }).catch((e) => {
        expect(e.message).to.eq('You requested a backend event we cannot handle: foo')
      })
    })
  })

  context('.isCy', () => {
    it('returns true on cy, cy chainable', () => {
      expect(Cypress.isCy(cy)).to.be.true

      const chainer = cy.wrap().then(() => {
        expect(Cypress.isCy(chainer)).to.be.true
      })
    })

    it('returns false on non-cy objects', () => {
      expect(Cypress.isCy(undefined)).to.be.false

      expect(Cypress.isCy(() => {
        return {}
      })).to.be.false
    })
  })

  context('.log', () => {
    it('throws when passing non-object to Cypress.log()', () => {
      const fn = () => {
        Cypress.log('My Log')
      }

      expect(fn).to.throw().with.property('message')
      .and.include('`Cypress.log()` can only be called with an options object. Your argument was: `My Log`')

      expect(fn).to.throw().with.property('docsUrl')
      .and.eq('https://on.cypress.io/cypress-log')
    })

    it('does not throw when Cypress.log() called outside of command', () => {
      const fn = () => {
        Cypress.log({ message: 'My Log' })
      }

      expect(fn).to.not.throw()
    })
  })

  context('.testingType', () => {
    // https://github.com/cypress-io/cypress/issues/17664
    it(`should be one of 'e2e' or 'component', not undefined`, () => {
      expect(Cypress.testingType).to.be.oneOf(['e2e', 'component'])
    })
  })

  context('private command methods', () => {
    it('throws when using Cypress.addAssertionCommand', () => {
      const addAssertionCommand = () => Cypress.addAssertionCommand()

      expect(addAssertionCommand).to.throw().and.satisfy((err) => {
        expect(err.message).to.include('You cannot use the undocumented private command interface: `addAssertionCommand`')

        return true
      })
    })

    it('throws when using Cypress.addUtilityCommand', () => {
      const addUtilityCommand = () => Cypress.addUtilityCommand()

      expect(addUtilityCommand).to.throw().and.satisfy((err) => {
        expect(err.message).to.include('You cannot use the undocumented private command interface: `addUtilityCommand`')

        return true
      })
    })
  })
})
