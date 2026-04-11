describe('s1', () => {
  // Passing in done forces the spec to timeout
  // eslint-disable-next-line
  it('t1', (done) => {
    cy.timeout(10)
    Array.from({ length: 25 }, () => expect(true).ok)
  })
})
