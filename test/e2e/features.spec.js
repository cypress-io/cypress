const EventEmitter = require('events').EventEmitter
const { expect } = require('chai')
const fs = require('fs-extra')
const path = require('path')

const preprocessor = require('../../index')

const fixturesDir = path.join(__dirname, '..', 'fixtures')
const outputDir = path.join(__dirname, '..', '_test-output')

const run = (fileName) => {
  const file = Object.assign(new EventEmitter(), {
    filePath: path.join(outputDir, fileName),
    outputPath: path.join(outputDir, fileName.replace('.', '_output.')),
  })

  return preprocessor()(file)
}

describe('features', () => {
  beforeEach(async () => {
    preprocessor.__reset()

    await fs.remove(outputDir)
    await fs.copy(fixturesDir, outputDir)
  })

  it('handles module interop, object spread, class properties, and async/await', async () => {
    const outputPath = await run('es_features_spec.js')
    const exists = await fs.pathExists(outputPath)

    expect(exists).to.be.true
  })

  it('handles jsx', async () => {
    const outputPath = await run('jsx_spec.jsx')
    const exists = await fs.pathExists(outputPath)

    expect(exists).to.be.true
  })

  it('handles coffeescript', async () => {
    const outputPath = await run('coffee_spec.coffee')
    const exists = await fs.pathExists(outputPath)

    expect(exists).to.be.true
  })

  it('handles typescript', async () => {
    const outputPath = await run('typescript_spec.ts')
    const exists = await fs.pathExists(outputPath)

    expect(exists).to.be.true
  })

  it('handles tsx', async () => {
    const outputPath = await run('tsx_spec.tsx')
    const exists = await fs.pathExists(outputPath)

    expect(exists).to.be.true
  })

  it('handles importing .js, .jsx, .ts, .tsx, and .coffee', async () => {
    const outputPath = await run('various_imports_spec.js')
    const exists = await fs.pathExists(outputPath)

    expect(exists).to.be.true
  })

  it('outputs inline source map', async () => {
    const outputPath = await run('es_features_spec.js')
    const contents = await fs.readFile(outputPath)

    expect(contents.toString()).to.include('//# sourceMappingURL=data:application/json;charset=utf-8;base64')
  })
})
