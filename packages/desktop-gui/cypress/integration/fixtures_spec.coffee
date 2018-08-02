publicJson = require("@cypress/json-schemas")

{ assertSchema } = publicJson.bind(publicJson)

omitErrObjects = {
   object: true,
   example: true,
 }

describe "fixtures match api object schemas: ", ->
  it "runs", ->
    cy.fixture("runs").each assertSchema("getRunResponse", "2.1.0", {
      substitutions: ["orgId"], omit: omitErrObjects
    })
