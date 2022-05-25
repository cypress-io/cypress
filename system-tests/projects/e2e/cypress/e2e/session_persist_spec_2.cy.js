/**
 * This is part 2 of the session persist spec
 * This part makes sure session data is cleared inbetween specs in run mode
 */

describe('after running spec with saved session', () => {
  it('has an initially blank session on new spec', () => {
    cy.session('persist_session', () => {
      cy.setCookie('cookieName', 'cookieValue')
    })

    return cy.wrap(null).should(() => {
      expect(cy.$$('.commands-container li.command:first', top.document).text()).contain('(new)')
    })
  })
})
