const portCheck = Cypress.env('PORT_CHECK')

it('ensures we have launched at the overridden port', () => {
  expect(portCheck).to.be.a('number')
  expect(portCheck).to.be.oneOf([8888, 9999])

  expect(window.location.host).to.eq(`localhost:${portCheck}`)
})
