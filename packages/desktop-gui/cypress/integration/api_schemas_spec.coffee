{assertSchema} = require("@cypress/json-schemas").api

describe "api object schemas matches fixture: ", ->
  it "runs", ->
    cy.fixture("runs.json").each assertSchema("getRunResponse", "2.0.0", ["orgId"])
