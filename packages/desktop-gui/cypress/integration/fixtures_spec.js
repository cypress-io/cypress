const publicJson = require('@cypress/json-schemas')

const { assertSchema } = publicJson.bind(publicJson)

const omitErrObjects = {
  object: true,
  example: true,
}

describe('fixtures match api object schemas: ', () => {
  it('getRunResponse', () => {
    cy.fixture('runs').each(assertSchema('getRunResponse', '2.5.0', {
      substitutions: ['orgId'], omit: omitErrObjects,
    }))
  })

  it('instance', () => {
    cy.fixture('runs').each((run) => {
      run.instances.forEach(assertSchema('instance', '2.4.0'))
    })
  })
})
