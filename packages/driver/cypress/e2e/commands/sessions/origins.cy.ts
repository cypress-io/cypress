import { getAllHtmlOrigins, mapOrigins } from '../../../../src/cy/commands/sessions/origins'
const $Cypress = require('../../../../src/cypress').default

describe('src/cy/commands/sessions/origins', () => {
  let CypressInstance
  let baseUrl

  beforeEach(function () {
    CypressInstance = new $Cypress()
    baseUrl = Cypress.config('baseUrl')
  })

  describe('mapOrigins()', () => {
    it('returns unique origins when requesting all origins', () => {
      const storedOrigins = {
        [baseUrl]: {},
        'https://example.com': {},
        'http://foobar.com': {},
      }

      cy.stub(CypressInstance, 'backend')
      .callThrough()
      .withArgs('get:rendered:html:origins')
      .resolves(storedOrigins)

      cy.wrap(mapOrigins(CypressInstance, '*')).then((origins) => {
        expect(origins).to.deep.equal([baseUrl, 'https://example.com', 'http://foobar.com'])
      })
    })

    it('returns current origin when requesting the current origin', () => {
      cy.stub(CypressInstance, 'backend').callThrough().withArgs('get:rendered:html:origins')

      cy.wrap(mapOrigins(CypressInstance, 'currentOrigin')).then((origins) => {
        expect(origins).to.deep.equal([baseUrl])
        expect(CypressInstance.backend).not.to.be.calledWith('get:rendered:html:origins')
      })
    })

    it('returns specific origin when requesting a specific origin', () => {
      cy.stub(CypressInstance, 'backend').callThrough().withArgs('get:rendered:html:origins')

      cy.wrap(mapOrigins(CypressInstance, 'https://example.com/random_page?1')).then((origins) => {
        expect(origins).to.deep.equal(['https://example.com'])
        expect(CypressInstance.backend).not.to.be.calledWith('get:rendered:html:origins')
      })
    })

    it('return origins when requesting a list of origins', () => {
      const storedOrigins = {
        [baseUrl]: {},
        'https://example.com': {},
        'http://foobar.com': {},
        'https://other.com': {},
      }

      cy.stub(CypressInstance, 'backend')
      .callThrough()
      .withArgs('get:rendered:html:origins')
      .resolves(storedOrigins)

      cy.wrap(mapOrigins(CypressInstance, ['*', 'https://other.com'])).then((origins) => {
        expect(origins).to.deep.equal([baseUrl, 'https://example.com', 'http://foobar.com', 'https://other.com'])
      })
    })
  })

  describe('getAllHtmlOrigins()', () => {
    it('returns rendered html origins from backend', () => {
      const storedOrigins = {
        [baseUrl]: {},
        'https://example.com': {},
        'http://foobar.com': {},
      }

      cy.stub(CypressInstance, 'backend')
      .callThrough()
      .withArgs('get:rendered:html:origins')
      .resolves(storedOrigins)

      cy.wrap(getAllHtmlOrigins(CypressInstance)).then((origins) => {
        expect(origins).to.deep.equal([baseUrl, 'https://example.com', 'http://foobar.com'])
      })
    })
  })
})
