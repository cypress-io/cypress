describe "$Cypress.Cy Agents API", ->
  it ".create", ->
    agent = $Cypress.Agents.create({}, {})
    expect(agent).to.be.instanceof $Cypress.Agents