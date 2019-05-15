context('response timeouts result in an error', () => {

  // errors out after 100ms
  it('handles no response errors on the initial visit', () => {
    cy
    .visit('http://localhost:3434/response_never_finishes')
  })

  // errors out after 100ms
  it('handles no response errors when not initially visiting', () => {
    cy
    .visit('http://localhost:3434/index.html')
    .visit('http://localhost:3434/response_never_finishes')
  })
})
