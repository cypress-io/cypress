describe('when status code isnt 2xx or 3xx', () => {
  it('fails', () => {
    cy.request(`http://localhost:2294/myreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallylong\
`)
  })
})
