const EventEmitter = require('events').EventEmitter
const expect = require('chai').expect
const fs = require('fs-extra')
const path = require('path')
const snapshot = require('snap-shot-it')

const preprocessor = require('../../index')

describe('webpack preprocessor - e2e', () => {
  const outputPath = path.join(__dirname, '..', '_test-output', 'output.js')

  let file
  let filePath

  beforeEach(() => {
    fs.removeSync(path.join(__dirname, '_test-output'))

    const originalFilePath = path.join(__dirname, '..', 'fixtures', 'example_spec.js')

    filePath = path.join(__dirname, '..', '_test-output', 'example_spec.js')
    fs.copyFileSync(originalFilePath, filePath)

    file = Object.assign(new EventEmitter(), {
      filePath,
      outputPath,
    })
  })

  it('correctly preprocesses the file', () => {
    return preprocessor()(file).then(() => {
      snapshot(fs.readFileSync(outputPath).toString())
    })
  })
})
