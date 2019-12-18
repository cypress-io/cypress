const publicJson = require('@cypress/json-schemas')

const { assertSchema } = publicJson.bind(publicJson)

const omitErrObjects = {
  object: true,
  example: true,
}

describe('fixtures match api object schemas: ', () => {
  it('runs', () => {
    cy.fixture('runs').each(assertSchema('getRunResponse', '2.2.0', {
      substitutions: ['orgId'], omit: omitErrObjects,
    }))
  })
})
