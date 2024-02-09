import { getAllHtmlOrigins, mapOrigins } from '../../../../src/cy/commands/sessions/origins'
const $Cypress = require('../../../../src/cypress').default

describe('src/cy/commands/sessions/origins', () => {
  let CypressInstance
  let baseUrl

  beforeEach(function () {
    // @ts-ignore
    CypressInstance = new $Cypress()
    baseUrl = Cypress.config('baseUrl')
  })

  describe('mapOrigins()', () => {
    it('returns unique origins when requesting all origins', async () => {
      const storedOrigins = {
        [baseUrl]: {},
        'https://example.com': {},
        'http://foobar.com': {},
      }

      cy.stub(CypressInstance, 'backend')
      .callThrough()
      .withArgs('get:rendered:html:origins')
      .resolves(storedOrigins)

      const origins = await mapOrigins(CypressInstance, '*')

      expect(origins).to.deep.equal([baseUrl, 'https://example.com', 'http://foobar.com'])
    })

    it('returns current origin when requesting the current origin', async () => {
      cy.stub(CypressInstance, 'backend').callThrough().withArgs('get:rendered:html:origins')

      const origins = await mapOrigins(CypressInstance, 'currentOrigin')

      expect(origins).to.deep.equal([baseUrl])
      expect(CypressInstance.backend).not.to.be.calledWith('get:rendered:html:origins')
    })

    it('returns specific origin when requesting a specific origin', async () => {
      cy.stub(CypressInstance, 'backend').callThrough().withArgs('get:rendered:html:origins')

      const origins = await mapOrigins(CypressInstance, 'https://example.com/random_page?1')

      expect(origins).to.deep.equal(['https://example.com'])
      expect(CypressInstance.backend).not.to.be.calledWith('get:rendered:html:origins')
    })

    it('return origins when requesting a list of origins', async () => {
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

      const origins = await mapOrigins(CypressInstance, ['*', 'https://other.com'])

      expect(origins).to.deep.equal([baseUrl, 'https://example.com', 'http://foobar.com', 'https://other.com'])
    })
  })

  describe('getAllHtmlOrigins()', () => {
    it('returns rendered html origins from backend', async () => {
      const storedOrigins = {
        [baseUrl]: {},
        'https://example.com': {},
        'http://foobar.com': {},
      }

      cy.stub(CypressInstance, 'backend')
      .callThrough()
      .withArgs('get:rendered:html:origins')
      .resolves(storedOrigins)

      const origins = await getAllHtmlOrigins(CypressInstance)

      expect(origins).to.deep.equal([baseUrl, 'https://example.com', 'http://foobar.com'])
    })
  })
})
