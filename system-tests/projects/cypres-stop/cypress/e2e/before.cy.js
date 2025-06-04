describe('Cypress.stop() in before', () => {
  before(() => {
    console.log('before 1')
  })

  before(() => {
    Cypress.stop()
    console.log('before 2')
  })

  before(() => {
    console.log('before 3')
  })

  it('should not run this test', () => {
    throw new Error('This test should not run')
  })

  it('should also not run this test', () => {
    throw new Error('This test should not run')
  })
})
