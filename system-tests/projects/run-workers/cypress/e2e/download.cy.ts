it('downloads a file', () => {
  cy.task('recordSpec', Cypress.spec.relative)
  cy.document().then((doc) => {
    const link = doc.createElement('a')

    link.href = 'data:text/plain,hello'
    link.download = 'hello.txt'
    doc.body.appendChild(link)
    link.click()
  })

  cy.wait(4000)
})
