describe "$Cypress.Cy Server API", ->
  it ".create", ->
    fakeServer = @sandbox.useFakeServer()
    server = $Cypress.Server.create(fakeServer, {})
    expect(server).to.be.instanceof $Cypress.Server