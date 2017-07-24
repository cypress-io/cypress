const path = require('path')

// this runs just the project in new desktop gui mode
// process.argv.push(
//   '--project',
//   path.resolve('test')
// )

// this runs a spec to completion + launches chrome
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
