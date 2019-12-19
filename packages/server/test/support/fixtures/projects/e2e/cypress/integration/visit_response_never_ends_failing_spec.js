context('response timeouts result in an error', () => {
  // ESOCKETTIMEDOUT after ~2 seconds
  it('handles no response errors on the initial visit', () => {
    cy
    .visit('http://localhost:3434/response_never_finishes')
  })

  // ESOCKETTIMEDOUT after ~2 seconds
  it('handles no response errors when not initially visiting', () => {
    cy
    .visit('http://localhost:3434/index.html')
    .visit('http://localhost:3434/response_never_finishes')
  })

  it('fails after reducing the responseTimeout option', () => {
    // our responseTimeout by default is set to 2000
    // because of the responseTimeout configuration option
    // which would normally pass this test because the
    // response is sent back in 1000, but by setting
    // it manually to 500, it should time out
    cy
    .visit('http://localhost:3434/timeout?ms=1000', { responseTimeout: 500 })
  })
})
