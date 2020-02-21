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
    const originalFilePath = path.join(__dirname, '..', 'fixtures', 'example_spec.js')

    filePath = path.join(__dirname, '..', '_test-output', 'example_spec.js')

    preprocessor.__reset()
    fs.removeSync(path.join(__dirname, '_test-output'))
    fs.outputFileSync(filePath, '')
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

  it('allows attaching catch later on syntax error without triggering unhandled rejection', (done) => {
    process.on('unhandledRejection', (err) => {
      // eslint-disable-next-line no-console
      console.error('Unhandled Rejection:', err.stack)
      done('Should not have trigger unhandled rejection')
    })

    file.shouldWatch = true

    preprocessor()(file).then(() => {
      fs.outputFileSync(filePath, '{')

      setTimeout(() => {
        preprocessor()(file)
        .catch((err) => {
          expect(err.stack).to.include('Unexpected token')
          file.emit('close')
          done()
        })
      }, 1000)
    })
  })
})
