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

const normalizeErrMessage = (message) => {
  return message.replace(/\/\S+\/_test/g, '<path>/_test')
}

const fixturesDir = path.join(__dirname, '..', 'fixtures')
const outputDir = path.join(__dirname, '..', '_test-output')

const createFile = ({ name = 'example_spec.js', shouldWatch = false } = {}) => {
  return Object.assign(new EventEmitter(), {
    filePath: path.join(outputDir, name),
    outputPath: path.join(outputDir, name.replace('.', '_output.')),
    shouldWatch,
  })
}

describe('webpack preprocessor - e2e', () => {
  let file

  beforeEach(async () => {
    preprocessor.__reset()

    await fs.remove(outputDir)
    await fs.copy(fixturesDir, outputDir)
  })

  afterEach(async () => {
    if (file.shouldWatch) {
      await new Promise((resolve) => {
        file.emit('close', resolve)
      })
    }
  })

  it('correctly preprocesses the file', () => {
    const options = preprocessor.defaultOptions

    options.webpackOptions.mode = 'production' // snapshot will be minified
    file = createFile()

    return preprocessor(options)(file).then((outputPath) => {
      snapshot(fs.readFileSync(outputPath).toString())
    })
  })

  it('has less verbose "Module not found" error', () => {
    file = createFile({ name: 'imports_nonexistent_file_spec.js' })

    return preprocessor()(file)
    .then(() => {
      throw new Error('Should not resolve')
    })
    .catch((err) => {
      snapshot(normalizeErrMessage(err.message))
    })
  })

  it('has less verbose syntax error', () => {
    file = createFile({ name: 'syntax_error_spec.js' })

    return preprocessor()(file)
    .then(() => {
      throw new Error('Should not resolve')
    })
    .catch((err) => {
      snapshot(normalizeErrMessage(err.message))
    })
  })

  it('allows attaching catch later on syntax error without triggering unhandled rejection', async () => {
    process.on('unhandledRejection', (err) => {
      // eslint-disable-next-line no-console
      console.error('Unhandled Rejection:', err.stack)
      throw new Error('Should not have trigger unhandled rejection')
    })

    file = createFile({ shouldWatch: true })

    await preprocessor()(file)
    await fs.outputFile(file.filePath, '{')

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
    file = createFile({ shouldWatch: true })

    await preprocessor()(file)

    const _emit = sinon.spy(file, 'emit')

    await fs.outputFile(file.filePath, '{')

    await retry(() => expect(_emit).calledWith('rerun'))
  })

  it('does not call rerun on initial build, but on subsequent builds', async () => {
    file = createFile({ shouldWatch: true })
    const _emit = sinon.spy(file, 'emit')

    await preprocessor()(file)

    expect(_emit).not.to.be.calledWith('rerun')

    await fs.outputFile(file.filePath, 'console.log()')

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
