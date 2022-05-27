describe('issue #1854', () => {
  it('does not error when using setTimeouts referencing string globals', () => {
    cy.visit('/fixtures/generic.html')
    cy.window().then((win) => {
      win.foo = (arg) => {
        win.bar = arg
      }

      win.setTimeout('foo(true)', 100)
    })

    cy.window().its('bar').should('be.true')
  })
})
