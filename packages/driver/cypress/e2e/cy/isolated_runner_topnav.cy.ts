// Isolated-runner spike, kept apart because a successful top-frame navigation
// takes the runner down with it.
describe('isolated runner: top-frame navigation', { browser: { family: 'chromium' }, defaultCommandTimeout: 2000 }, () => {
  it('the app cannot navigate the top frame', () => {
    cy.visit('http://www.foobar.com:3500/fixtures/remote-driver-isolation.html')
    cy.get('#bust').click()
    cy.get('#probe-result').should('contain', 'blocked').then(($el) => {
      cy.task('log', `top navigation probe: ${$el.text()}`)
    })

    cy.get('#page').should('have.text', '1')
  })
})
