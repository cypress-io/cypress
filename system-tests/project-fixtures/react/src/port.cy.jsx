it('ensures we have launched at the overridden port', () => {
  cy.env(['PORT_CHECK']).then(({ PORT_CHECK }) => {
    expect(PORT_CHECK).to.be.a('number')
    expect(PORT_CHECK).to.be.oneOf([8888, 9999])

    expect(window.location.host).to.eq(`localhost:${PORT_CHECK}`)
  })
})
