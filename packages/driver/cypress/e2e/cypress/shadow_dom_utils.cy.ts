import { resolveShadowDomInclusion } from '../../../src/cypress/shadow_dom_utils'

describe('src/cypress/shadow_dom_utils', () => {
  context('.resolveShadowDomInclusion', () => {
    let CypressMock

    beforeEach(() => {
      CypressMock = {
        config: cy.stub(),
      }
    })

    it('returns true if command value is true', () => {
      CypressMock.config.withArgs('includeShadowDom').returns(false)

      expect(resolveShadowDomInclusion(CypressMock, true)).to.be.true
    })

    it('returns false if command value is false', () => {
      CypressMock.config.withArgs('includeShadowDom').returns(true)

      expect(resolveShadowDomInclusion(CypressMock, false)).to.be.false
    })

    describe('when command value is undefined', () => {
      it('returns true if config value is true', () => {
        CypressMock.config.withArgs('includeShadowDom').returns(true)

        expect(resolveShadowDomInclusion(CypressMock)).to.be.true
      })

      it('returns false if config value is false', () => {
        CypressMock.config.withArgs('includeShadowDom').returns(false)

        expect(resolveShadowDomInclusion(CypressMock)).to.be.false
      })
    })
  })
})
