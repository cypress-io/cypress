// Stops itself so that runner.ui.cy.ts can pin a command afterwards. The stop takes effect once
// the command in flight finishes, hence the short wait. The third test keeps the stopped one from
// being the last in the suite — only a non-final test resets the page.
describe('stop preserves the aut', {
  // the project sets this to 0; the first test's snapshots have to survive into the second to be pinnable
  numTestsKeptInMemory: 2,
}, () => {
  it('completed test', () => {
    cy.visit('cypress/fixtures/example.html')
    cy.get('input').type('pinned')
  })

  it('test stops while running', () => {
    cy.visit('cypress/fixtures/example.html')
    cy.then(() => {
      const appDoc = window.parent.document

      appDoc.getElementById('reporter-frame').contentDocument.querySelector('button.stop').click()
    })

    cy.wait(500)
  })

  it('never runs', () => {
    cy.visit('cypress/fixtures/example.html')
  })
})
