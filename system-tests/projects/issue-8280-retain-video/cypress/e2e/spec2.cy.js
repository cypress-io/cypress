// here the delays are just so there is something in the screenshots and recordings.

describe('spec2', () => {
  it('testCase1', () => {
    cy.wait(500)
    assert(false)
  })

  it('testCase2', () => {
    cy.wait(500)
    assert(true)
  })
})
