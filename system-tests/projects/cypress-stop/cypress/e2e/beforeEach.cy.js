describe('Cypress.stop() in beforeEach', () => {
  beforeEach(() => {
    console.log('beforeEach 1')
  })

  beforeEach(() => {
    Cypress.stop()
    console.log('beforeEach 2')
  })

  beforeEach(() => {
    console.log('beforeEach 3')
  })

  it('should not run this test', () => {
    throw new Error('This test should not run')
  })

  it('should also not run this test', () => {
    throw new Error('This test should not run')
  })
})
