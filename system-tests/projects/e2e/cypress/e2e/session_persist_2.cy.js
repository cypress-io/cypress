/**
 * This is part 2 of the session persist spec
 * This part makes sure session data is cleared in-between specs in run mode
 */

const expectCurrentSessionData = (obj) => {
  cy.then(() => {
    return Cypress.session.getCurrentSessionData()
    .then((result) => {
      expect(result.cookies.map((v) => v.name)).members(obj.cookies || [])
      expect(result.localStorage).deep.members(obj.localStorage || [])
      expect(result.sessionStorage).deep.members(obj.sessionStorage || [])
    })
  })
}

describe('after running spec with saved session', () => {
  it('has an initially blank session on new spec', () => {
    cy.session('persist_session', () => {
      cy.visit('https://localhost:4466/cross_origin_iframe/cookies')
      cy.setCookie('cookieName', 'cookieValue')
    })

    cy.session('persist_global_session', () => {
      cy.setCookie('cookieName', 'cookieValue')
    }, {
      cacheAcrossSpecs: true,
    })

    cy.visit('https://localhost:4466/form')
    cy.contains('form')

    expectCurrentSessionData({
      cookies: ['/set-localStorage/cookies', '/cross_origin_iframe/cookies', '/form'],
      localStorage: [
        { origin: 'https://127.0.0.1:44665', value: { name: 'cookies' } },
      ],
    })

    return cy.wrap(null).should(() => {
      expect(cy.$$('.commands-container li.command:first', top.document).text()).contain('created')
      expect(cy.$$('.commands-container li.command:nth-child(2)', top.document).text()).contain('restored')
    })
  })
})
