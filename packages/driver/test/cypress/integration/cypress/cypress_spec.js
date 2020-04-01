const { $, Promise } = Cypress

describe('driver/src/cypress/index', () => {
  let CypressInstance

  beforeEach(() => {
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

  context('#backend', () => {
    it('sets __stackCleaned__ on errors', () => {
      cy.stub(CypressInstance, 'emit')
      .withArgs('backend:request')
      .yieldsAsync({
        error: {
          name: 'Error',
          message: 'msg',
          stack: 'stack',
        },
      })

      CypressInstance.backend('foo')
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

      Cypress.backend('foo', foo)
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

  context('.Log', () => {
    it('throws when using Cypress.Log.command()', () => {
      const fn = () => {
        Cypress.Log.command({})
      }

      expect(fn).to.throw('has been renamed to `Cypress.log()`')
    })

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
})
