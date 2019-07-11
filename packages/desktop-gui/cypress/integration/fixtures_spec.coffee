publicJson = require("@cypress/json-schemas")

{ assertSchema } = publicJson.bind(publicJson)

omitErrObjects = {
   object: true,
   example: true,
 }

describe "fixtures match api object schemas: ", ->
  # 2.2.0 isn't released yet, so this always fails
  it.skip "runs", ->
    cy.fixture("runs").each assertSchema("getRunResponse", "2.2.0", {
      substitutions: ["orgId"], omit: omitErrObjects
    })
