after(() => {
  // ensure that we're stable in the after hooks
  expect(cy.state('isStable')).to.be.true

  // ensure we can enqueue a command without timing out
  cy.then(() => {
    expect(true).to.be.true
  })
})

afterEach(() => {
  // ensure that we're stable in the after hooks
  expect(cy.state('isStable')).to.be.true

  // ensure that we can enqueue a command without timing out
  cy.then(() => {
    expect(true).to.be.true
  })
})

it('runs an after block without timing out when the page load times out', { pageLoadTimeout: 500 }, () => {
  cy.on('fail', (error) => {
    expect(error.message).to.include('Timed out after')

    return false
  })

  cy.on('window:before:load', (win) => {
    // Stop the page from loading so that the page load times out
    win.stop()
  })

  cy.visit('/fixtures/generic.html')
})
