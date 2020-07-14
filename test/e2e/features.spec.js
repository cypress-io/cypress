const EventEmitter = require('events').EventEmitter
const fs = require('fs-extra')
const path = require('path')

const preprocessor = require('../../index')

const fixturesDir = path.join(__dirname, '..', 'fixtures')
const outputDir = path.join(__dirname, '..', '_test-output')

const run = (fileName, options = {}) => {
  const file = Object.assign(new EventEmitter(), {
    filePath: path.join(outputDir, fileName),
    outputPath: path.join(outputDir, fileName.replace('.', '_output.')),
  })

  return preprocessor(options)(file)
}

describe('features', () => {
  beforeEach(async () => {
    await fs.remove(outputDir)
    await fs.copy(fixturesDir, outputDir)
  })

  it('handles module interop, object spread, class properties, and async/await', () => {
    return run('es_features_spec.js')
  })

  it('handles jsx', () => {
    return run('jsx_spec.jsx')
  })

  it('handles coffeescript', () => {
    return run('coffee_spec.coffee')
  })

  it('handles typescript', () => {
    return run('typescript_spec.ts', { typescript: require.resolve('typescript') })
  })
})
