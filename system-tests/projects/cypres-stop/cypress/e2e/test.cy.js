describe('Cypress.stop() in test', () => {
  it('should run this test', () => {
    console.log('test 1')
  })

  it('should stop during test execution', () => {
    Cypress.stop()
    console.log('test 2')
  })

  it('should not run this test', () => {
    console.log('test 3')
    throw new Error('This test should not run')
  })
})
