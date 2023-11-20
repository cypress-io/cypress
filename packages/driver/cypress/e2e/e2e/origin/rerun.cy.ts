// @ts-ignore
describe('cy.origin - rerun', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('successfully reruns tests', () => {
    // @ts-ignore
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('[data-cy="dom-check"]')
    })
    .then(() => {
      const top = window.top!

      // @ts-ignore
      if (!top.hasRunOnce) {
        // @ts-ignore
        top.hasRunOnce = true

        // cause a rerun event to occur by triggering a hash change
        top.dispatchEvent(new Event('hashchange'))

        return
      }

      // this only executes after the test has been rerun
      expect(true).to.be.true
    })
  })
})
