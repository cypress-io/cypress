// @ts-ignore
describe('multi-domain - rerun', { }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  // this test will hang without the fix for multi-domain rerun
  // https://github.com/cypress-io/cypress/issues/18043
  it('successfully reruns tests', () => {
    // @ts-ignore
    cy.switchToDomain('foobar.com', () => {
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
