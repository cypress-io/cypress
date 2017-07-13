const path = require('path')

process.argv.push(
  '--run-project',
  path.resolve('test'),
  '--browser=chrome',
  '--headless=false',
  '--driver',
  '--spec',
  path.resolve('test', 'cypress', 'integration', 'actions', 'checkbox_spec.coffee')
)

require('@packages/server')
.then((code) => {
  console.log('GOT CODE', code)

  return process.exit(code)
})
