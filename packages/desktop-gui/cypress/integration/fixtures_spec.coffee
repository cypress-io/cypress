jsonSchemas = require("@cypress/json-schemas")

{ assertSchema } = jsonSchemas

describe "api object schemas matches fixture: ", ->
  it "runs", ->
    cy.fixture("runs.json").each assertSchema("getRunResponse", "2.0.0", {
      substitutions: ["orgId"], omit: { object: true, example: true }
    })
