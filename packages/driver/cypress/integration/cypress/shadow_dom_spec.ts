import { createShadowDom } from '../../../src/cypress/shadow_dom'

describe('src/cypress/shadow_dom', () => {
  let ShadowDom

  beforeEach(() => {
    ShadowDom = createShadowDom()
  })

  it('has defaults', () => {
    expect(ShadowDom.getConfig()).to.deep.equal({})
  })

  context('.getConfig', () => {
    it('returns copy of config', () => {
      const config = ShadowDom.getConfig()

      expect(ShadowDom.getConfig()).not.to.equal(config)
      expect(ShadowDom.getConfig()).to.deep.equal(config)
    })
  })

  context('.defaults', () => {
    it('is noop if not called with any valid properties', () => {
      ShadowDom.defaults({})
      expect(ShadowDom.getConfig()).to.deep.eq({})
    })

    it('sets shadowDomOptionPlaceholder if specified', () => {
      ShadowDom.defaults({
        shadowDomOptionPlaceholder: true,
      })

      expect(ShadowDom.getConfig().shadowDomOptionPlaceholder).to.equal(true)
    })

    describe('errors', () => {
      it('throws if not passed an object', () => {
        const fn = () => {
          ShadowDom.defaults()
        }

        expect(fn).to.throw()
        .with.property('message')
        .and.include('`Cypress.ShadowDom.defaults()` must be called with an object. You passed: ``')

        expect(fn).to.throw()
        .with.property('docsUrl')
        .and.include('https://on.cypress.io/shadow-dom-api')
      })

      it('throws if scale is not a boolean', () => {
        const fn = () => {
          ShadowDom.defaults({ shadowDomOptionPlaceholder: 'foo' })
        }

        expect(fn).to.throw()
        .with.property('message')
        .and.include('`Cypress.ShadowDom.defaults()` `shadowDomOptionPlaceholder` option must be a boolean. You passed: `foo`')

        expect(fn).to.throw()
        .with.property('docsUrl')
        .and.eq('https://on.cypress.io/shadow-dom-api')
      })
    })
  })

  context('.resolveInclusionValue', () => {
    let CypressMock

    beforeEach(() => {
      CypressMock = {
        config: cy.stub(),
      }
    })

    describe('when experimental flag is false', () => {
      beforeEach(() => {
        CypressMock.config.withArgs('experimentalShadowDomSupport').returns(false)
      })

      it('returns false', () => {
        ShadowDom.defaults({ shadowDomOptionPlaceholder: true })
        CypressMock.config.withArgs('shadowDomOptionPlaceholder').returns(true)

        expect(ShadowDom.resolveInclusionValue(CypressMock, true)).to.be.false
      })
    })

    describe('when experimental flag is true', () => {
      beforeEach(() => {
        CypressMock.config.withArgs('experimentalShadowDomSupport').returns(true)
      })

      it('returns true if user value is true', () => {
        ShadowDom.defaults({ shadowDomOptionPlaceholder: false })
        CypressMock.config.withArgs('shadowDomOptionPlaceholder').returns(false)

        expect(ShadowDom.resolveInclusionValue(CypressMock, true)).to.be.true
      })

      it('returns false if user value is false', () => {
        ShadowDom.defaults({ shadowDomOptionPlaceholder: true })
        CypressMock.config.withArgs('shadowDomOptionPlaceholder').returns(true)

        expect(ShadowDom.resolveInclusionValue(CypressMock, false)).to.be.false
      })

      describe('when user value is undefined', () => {
        it('returns true if defaults value is true', () => {
          ShadowDom.defaults({ shadowDomOptionPlaceholder: true })
          CypressMock.config.withArgs('shadowDomOptionPlaceholder').returns(false)

          expect(ShadowDom.resolveInclusionValue(CypressMock)).to.be.true
        })

        it('returns false if defaults value is false', () => {
          ShadowDom.defaults({ shadowDomOptionPlaceholder: false })
          CypressMock.config.withArgs('shadowDomOptionPlaceholder').returns(true)

          expect(ShadowDom.resolveInclusionValue(CypressMock)).to.be.false
        })

        describe('when defaults value is undefined', () => {
          it('returns true if config value is true', () => {
            CypressMock.config.withArgs('shadowDomOptionPlaceholder').returns(true)

            expect(ShadowDom.resolveInclusionValue(CypressMock)).to.be.true
          })

          it('returns false if config value is false', () => {
            CypressMock.config.withArgs('shadowDomOptionPlaceholder').returns(false)

            expect(ShadowDom.resolveInclusionValue(CypressMock)).to.be.false
          })
        })
      })
    })
  })
})
