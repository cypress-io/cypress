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
})
