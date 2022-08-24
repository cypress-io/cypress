/**
 * This is part 2 of the session persist spec
 * This part makes sure session data is cleared in-between specs in run mode
 */

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

    return cy.wrap(null).should(() => {
      expect(cy.$$('.commands-container li.command:first', top.document).text()).contain('created')
      expect(cy.$$('.commands-container li.command:nth-child(2)', top.document).text()).contain('restored')
    })
  })
})
