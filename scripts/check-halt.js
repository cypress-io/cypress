/* eslint-disable no-console */
const execa = require('execa')
const argv = require('minimist')(process.argv.slice(2))

const changedPackages = require('./changed-packages')

const runTests = () => {
  process.exit(0)
}

const skipTests = () => {
  process.exit(1)
}

const main = async (pack = 'cypress') => {
  const { stdout: currentBranch } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'])

  if (currentBranch === 'develop' || currentBranch === 'master') {
    console.log(`Currently on ${currentBranch} - all tests run`)
    runTests()
  }

  const changed = await changedPackages()

  if (Object.keys(changed).includes(pack)) {
    console.log(`${pack} was directly changed, tests run`)
    runTests()
  }

  const dependenciesChanged = []

  for (const c in changed) {
    if (changed[c].includes(pack)) {
      dependenciesChanged.push(c)
    }
  }

  if (dependenciesChanged.length) {
    console.log(`${pack} is listed as a dependant of ${dependenciesChanged.join(', ')}, so tests run.`)
    runTests()
  }

  console.log(`${pack} is unchanged and not dependent on any changed packages, so tests do not run.`)
  skipTests()
}

const pack = argv._[0]

main(pack)
