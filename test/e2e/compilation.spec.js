const EventEmitter = require('events').EventEmitter
const chai = require('chai')
const fs = require('fs-extra')
const path = require('path')
const snapshot = require('snap-shot-it')
const sinon = require('sinon')
const Bluebird = require('bluebird')
const sinonChai = require('sinon-chai')

chai.use(sinonChai)
const { expect } = chai

const preprocessor = require('../../dist/index')

describe('webpack preprocessor - e2e', () => {
  const outputPath = path.join(__dirname, '..', '_test-output', 'output.js')

  let file
  let filePath

  beforeEach(async () => {
    const originalFilePath = path.join(__dirname, '..', 'fixtures', 'example_spec.js')

    filePath = path.join(__dirname, '..', '_test-output', 'example_spec.js')

    preprocessor.__reset()
    await fs.remove(path.join(__dirname, '_test-output'))
    await fs.outputFile(filePath, '')
    await fs.copyFile(originalFilePath, filePath)

    file = Object.assign(new EventEmitter(), {
      filePath,
      outputPath,
    })
  })

  afterEach(async () => {
    if (file.shouldWatch) {
      await new Promise((resolve) => {
        file.emit('close', resolve)
      })
    }
  })

  it('correctly preprocesses the file', () => {
    return preprocessor()(file).then(() => {
      snapshot(fs.readFileSync(outputPath).toString())
    })
  })

  it('allows attaching catch later on syntax error without triggering unhandled rejection', async () => {
    process.on('unhandledRejection', (err) => {
      // eslint-disable-next-line no-console
      console.error('Unhandled Rejection:', err.stack)
      throw new Error('Should not have trigger unhandled rejection')
    })

    file.shouldWatch = true

    await preprocessor()(file)
    await fs.outputFile(filePath, '{')

    await new Promise((resolve) => {
      setTimeout(() => {
        preprocessor()(file)
        .catch((err) => {
          expect(err.stack).to.include('Unexpected token')
          resolve()
        })
      }, 1000)
    })
  })

  it('triggers rerun on syntax error', async () => {
    const _emit = sinon.spy(file, 'emit')

    file.shouldWatch = true

    await preprocessor()(file)

    _emit.resetHistory()

    await fs.outputFile(filePath, '{')

    await retry(() => expect(_emit).calledWith('rerun'))
  })
})

function retry (fn, timeout = 1000) {
  let timedOut = false

  setTimeout(() => timedOut = true, timeout)
  const tryFn = () => {
    return Bluebird.try(() => {
      return fn()
    })

    .catch((err) => {
      if (timedOut) {
        throw err
      }

      return Bluebird.delay(100).then(() => tryFn())
    })
  }

  return tryFn()
}
