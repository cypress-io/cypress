const cypress = require('cypress')

console.log('cypress is', cypress)

async function testSpec (spec) {
  console.assert(spec, 'missing spec filename')
  console.log('running test %s', spec)
  const result = await cypress.run({ spec })

  console.log(result)
}
(async () => {
  await testSpec('./cypress/integration/a-spec.js')
  await testSpec('./cypress/integration/b-spec.js')
})()
