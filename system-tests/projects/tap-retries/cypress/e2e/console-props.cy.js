describe('Console Props', () => {
  it('logs inspectable command details', () => {
    cy.visit('cypress/e2e/pin-target.html')
    cy.get('#toggle')
    Cypress.log({ name: 'empty-console-props' }).set('consoleProps', null)

    // A long string and a large container next to short values, so the tap
    // binding's bounds are exercised while the structure must survive whole.
    Cypress.log({
      name: 'deep-console-props',
      consoleProps: () => {
        return {
          props: {
            actual: {
              body: Array.from({ length: 500 }, (_unused, index) => ({ id: index, tags: ['a', 'b'] })),
              note: 'x'.repeat(1200),
              headers: { 'content-type': 'application/json' },
              status: 200,
            },
          },
        }
      },
    })
  })
})
