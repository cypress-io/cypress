require('mocha-banner').register()

const cypress = require('cypress')
const chdir = require('chdir-promise')
const join = require('path').join
const fromFolder = join.bind(null, __dirname)
const snapshot = require('snap-shot-it')
const la = require('lazy-ass')
const is = require('check-more-types')
const debug = require('debug')('test')
const R = require('ramda')

const importantProperties = [
  'cypressVersion',
  'totalDuration',
  'totalSuites',
  'totalTests',
  'totalFailed',
  'totalPassed',
  'totalPending',
  'totalSkipped',
  'browserName',
  'browserVersion',
  'osName',
  'osVersion',
]

const pickImportant = R.pick(importantProperties)

const normalize = (output) => {
  la(is.unemptyString(output.cypressVersion), 'has Cypress version', output)
  la(is.positive(output.totalDuration), 'has duration', output)
  la(is.unemptyString(output.browserVersion), 'has browserVersion', output)
  la(is.unemptyString(output.osName), 'has osName', output)
  la(is.unemptyString(output.osVersion), 'has osVersion', output)

  output.cypressVersion = '0.0.0'
  output.totalDuration = 'X seconds'
  output.browserVersion = '1.2.3'
  output.osName = 'darwin'
  output.osVersion = '16.7.0'

  return output
}

describe('successful tests', () => {
  const projectFolder = fromFolder('successful')

  beforeEach(() => {
    chdir.to(projectFolder)
  })

  afterEach(chdir.back)

  it('returns with all successful tests', () => {
    return cypress.run()
    .then(R.tap(debug))
    .then(normalize)
    .then(pickImportant)
    .then(snapshot)
  })

  it('runs specific spec', () => {
    return cypress.run({
      spec: 'cypress/integration/a-spec.js',
    }).then(R.tap(debug))
    .then((result) => {
      la(result.totalTests === 1, 'there should be single test', result.totalTests)
    })
  })

  it('runs specific spec using absolute path', () => {
    const absoluteSpec = join(projectFolder, 'cypress/integration/a-spec.js')

    debug('absolute path to the spec: %s', absoluteSpec)

    return cypress.run({
      spec: absoluteSpec,
    }).then(R.tap(debug))
    .then((result) => {
      la(result.totalTests === 1, 'there should be single test', result.totalTests)
    })
  })

  it('runs a single spec using wildcard', () => {
    return cypress.run({
      spec: 'cypress/integration/a-*.js',
    }).then(R.tap(debug))
    .then((result) => {
      la(result.totalTests === 1, 'there should be single test', result.totalTests)
    })
  })

  it('runs both found specs using wildcard', () => {
    return cypress.run({
      spec: 'cypress/integration/a-*.js,cypress/integration/b-*.js',
    }).then(R.tap(debug))
    .then((result) => {
      la(result.totalTests === 2, 'found both tests', result.totalTests)
    })
  })
})

describe('env variables', () => {
  const projectFolder = fromFolder('env')

  beforeEach(() => {
    chdir.to(projectFolder)
  })

  afterEach(chdir.back)

  it('passes environment variables in the object', () => {
    return cypress.run({
      spec: 'cypress/integration/env-spec.js',
      env: {
        foo: {
          bar: 'baz',
        },
        another: 42,
      },
    })
  })
})

describe('failing test', () => {
  beforeEach(() => {
    chdir.to(fromFolder('failing'))
  })

  afterEach(chdir.back)

  it('returns correct number of failing tests', () => {
    return cypress.run()
    .then(normalize)
    .then(pickImportant)
    .then(snapshot)
  })
})

// https://github.com/cypress-io/cypress-test-module-api/issues/3
describe('invalid malformed spec file', () => {
  beforeEach(() => {
    chdir.to(fromFolder('invalid'))
  })

  afterEach(chdir.back)

  it('returns with error code', () => {
    // test has reference error on load
    return cypress.run({
      spec: './cypress/integration/a-spec.js',
    })
    .then(normalize)
    .then(pickImportant)
    .then(snapshot)
  })
})
