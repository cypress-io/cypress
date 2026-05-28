/* eslint-disable no-undef */
Cypress._.times(Cypress.env('NUM_TESTS'), (i) => {
  it(`num: ${i + 1} makes some long tests`, () => {
    cy.env(['MS_PER_TEST']).then(({ MS_PER_TEST }) => {
      cy.wait(MS_PER_TEST)
    })
  })
})
