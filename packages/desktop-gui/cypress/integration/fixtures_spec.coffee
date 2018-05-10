publicJson = require("@cypress/json-schemas")

{ assertSchema } = publicJson.tools.bind(publicJson)

describe "api object schemas matches fixture: ", ->
  it "runs", ->
    cy.fixture("runs.json").each assertSchema("getRunResponse", "2.0.0", {
      substitutions: ["orgId"], omit: { object: true, example: true }
    })
