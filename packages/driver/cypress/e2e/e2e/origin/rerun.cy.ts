describe('cy.origin - rerun', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('successfully reruns tests', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('[data-cy="dom-check"]')
    })
    .then(() => {
      const top = window.top!

      // @ts-expect-error - `hasRunOnce` is a test-only flag on window.top
      if (!top.hasRunOnce) {
        // @ts-expect-error - `hasRunOnce` is a test-only flag on window.top
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
