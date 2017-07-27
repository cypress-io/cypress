const { execSync } = require('child_process')
const glob = require('glob')
const path = require('path')

const specs = glob.sync('test/cypress/integration/**/*.coffee')
let numFailed = 0

specs.forEach((spec) => {
  const args = [
    '--project',
    path.resolve('test'),
    '--browser=chrome',
    '--driver',
    '--spec',
    spec.replace('test/', ''),
  ].join(' ')

  try {
    execSync(`node test/scripts/run-integration ${args}`, { stdio: 'inherit' })
  } catch (err) {
    numFailed += err.status
  }
})

process.exit(numFailed)
