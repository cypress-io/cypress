describe('Cypress.stop() in test', () => {
  it('should run this test', () => {
    console.log('test 1')
  })

  it('should stop during test execution', () => {
    return Cypress.stop()

    // eslint-disable-next-line no-unreachable
    console.log('test 2')
    throw new Error('This code should not run')
  })

  it('should not run this test', () => {
    console.log('test 3')
    throw new Error('This test should not run')
  })
})
