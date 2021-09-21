describe('multidomain - rerun', () => {
  beforeEach(() => {
    cy.visit('/fixtures/multidomain.html')
    // @ts-ignore
    cy.anticipateMultidomain()
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
      const { hash } = top.location

      // @ts-ignore
      if (!top.hasRunOnce) {
        // @ts-ignore
        top.hasRunOnce = true

        // hashchange causes the test to rerun
        top.location.hash = `${hash}?rerun`

        return
      }

      // this only executes after the test has been rerun
      expect(true).to.be.true
    })
  })
})
