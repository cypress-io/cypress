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

describe('webpack preprocessor - e2e', () => {
  let run
  let file

  beforeEach(async () => {
    preprocessor.__reset()

    run = ({ options, keepFile, shouldWatch = false, fileName = 'example_spec.js' } = {}) => {
      if (!keepFile) {
        file = Object.assign(new EventEmitter(), {
          filePath: path.join(outputDir, fileName),
          outputPath: path.join(outputDir, fileName.replace('.', '_output.')),
          shouldWatch,
        })
      }

      return preprocessor(options)(file)
    }

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

    return run({ options }).then((outputPath) => {
      snapshot(fs.readFileSync(outputPath).toString())
    })
  })

  it('has less verbose "Module not found" error', () => {
    return run({ fileName: 'imports_nonexistent_file_spec.js' })
    .then(() => {
      throw new Error('Should not resolve')
    })
    .catch((err) => {
      snapshot(normalizeErrMessage(err.message))
    })
  })

  it('has less verbose syntax error', () => {
    return run({ fileName: 'syntax_error_spec.js' })
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

    await run({ shouldWatch: true })
    await fs.outputFile(file.filePath, '{')

    await new Promise((resolve) => {
      setTimeout(() => {
        run({ keepFile: true, shouldWatch: true })
        .catch((err) => {
          expect(err.stack).to.include('Unexpected token')
          resolve()
        })
      }, 1000)
    })
  })

  it('triggers rerun on syntax error', async () => {
    await run({ shouldWatch: true })

    const _emit = sinon.spy(file, 'emit')

    await fs.outputFile(file.filePath, '{')

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
