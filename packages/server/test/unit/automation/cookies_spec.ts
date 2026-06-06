const { expect, sinon } = require('../../spec_helper')

import { Cookies, AutomationCookie } from '../../../lib/automation/cookies'

// Partitioned cookies (CHIPS) carry a `partitionKey` that must survive the
// server-side cookie normalization so it can be round-tripped back to the
// browser via CDP. The `COOKIE_PROPERTIES` allowlist used by
// `normalizeCookieProps` is the spot that previously stripped it, breaking
// cy.session() restore/clear. https://github.com/cypress-io/cypress/issues/33302
describe('lib/automation/cookies', () => {
  const partitionKey = { topLevelSite: 'https://example.com', hasCrossSiteAncestor: true }

  const partitionedCookie = (): AutomationCookie => {
    return {
      domain: 'example.com',
      expiry: 123,
      httpOnly: true,
      name: 'sso',
      path: '/',
      partitionKey,
      sameSite: 'no_restriction',
      secure: true,
      value: 'key',
    }
  }

  context('.normalizeCookieProps', () => {
    it('preserves the partitionKey of a partitioned cookie (CHIPS)', () => {
      const normalized = Cookies.normalizeCookieProps(partitionedCookie())

      expect(normalized).to.have.property('partitionKey').that.deep.equals(partitionKey)
    })

    it('does not add a partitionKey for an unpartitioned cookie', () => {
      const cookie = partitionedCookie()

      delete cookie.partitionKey

      const normalized = Cookies.normalizeCookieProps(cookie)

      expect(normalized).not.to.have.property('partitionKey')
    })
  })

  context('#getCookies', () => {
    it('preserves the partitionKey returned by the automation client', async () => {
      const cookies = new Cookies('__cypress', '__socket.io')
      const automate = sinon.stub().resolves([partitionedCookie()])

      const result = await cookies.getCookies({}, automate)

      expect(automate).to.have.been.calledWith('get:cookies', {})
      expect(result[0]).to.have.property('partitionKey').that.deep.equals(partitionKey)
    })
  })

  context('#setCookies', () => {
    it('passes the partitionKey through to the automation client', async () => {
      const cookies = new Cookies('__cypress', '__socket.io')
      const automate = sinon.stub().resolves([])

      await cookies.setCookies([partitionedCookie()], automate)

      const [eventName, sentCookies] = automate.getCall(0).args

      expect(eventName).to.eq('set:cookies')
      expect(sentCookies[0]).to.have.property('partitionKey').that.deep.equals(partitionKey)
    })
  })

  context('#clearCookies', () => {
    it('passes the partitionKey through to the automation client', async () => {
      const cookies = new Cookies('__cypress', '__socket.io')
      const automate = sinon.stub().resolves([])

      await cookies.clearCookies([partitionedCookie()], automate)

      const [eventName, sentCookies] = automate.getCall(0).args

      expect(eventName).to.eq('clear:cookies')
      expect(sentCookies[0]).to.have.property('partitionKey').that.deep.equals(partitionKey)
    })
  })
})
