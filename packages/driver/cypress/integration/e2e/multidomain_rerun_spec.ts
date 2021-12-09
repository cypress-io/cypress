describe('multidomain - rerun', () => {
  beforeEach(() => {
    cy.visit('/fixtures/multidomain.html')
    cy.get('a').click()
  })

  // this test will hang without the fix for multidomain rerun
  // https://github.com/cypress-io/cypress/issues/18043
  it('successfully reruns tests', () => {
    // @ts-ignore
    cy.switchToDomain('127.0.0.1:3501', () => {
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
