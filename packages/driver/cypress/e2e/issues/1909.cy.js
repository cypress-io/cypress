it('should receive the blur event when the activeElement is programmatically changed', () => {
  let blurred = false

  cy.visit('http://localhost:3500/fixtures/mui.html')

  cy
  .get('[label="Age"] [role="button"]')
  .click()

  cy
  .get('.MuiMenuItem-selected-63')
  .then(($el) => {
    $el.on('blur', () => {
      blurred = true
    })
  })

  cy
  .get('ul[role="listbox"]')
  .contains('Twenty')
  .click()
  .then(() => {
    expect(blurred).to.be.true
  })
})
