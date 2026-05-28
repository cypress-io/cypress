function myIt (name, fn) {
  it(name, fn)
}

myIt('test 1', () => {
  cy.log('testBody 1')
})

myIt('test 2', () => {
  cy.log('testBody 2')
})
