import { describe, beforeEach, afterEach, it, expect } from 'vitest'
import { EventEmitter } from 'events'
import fs from 'fs-extra'
import path from 'path'
import Bluebird from 'bluebird'
import stripAnsi from 'strip-ansi'
import preprocessor from '../../dist/index'

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
    // @ts-expect-error
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

  it('correctly preprocesses the file', async () => {
    const options = preprocessor.defaultOptions

    options.webpackOptions.mode = 'production' // snapshot will be minified
    file = createFile()

    const outputPath = await preprocessor(options)(file)

    expect(fs.readFileSync(outputPath).toString()).toMatchSnapshot()
  })

  it('has less verbose "Module not found" error', async () => {
    file = createFile({ name: 'imports_nonexistent_file_spec.js' })

    try {
      await preprocessor({})(file)
      throw new Error('Should not resolve')
    } catch (err) {
      expect(normalizeErrMessage(err.message)).toMatchSnapshot()
    }
  })

  it('has less verbose syntax error', async () => {
    file = createFile({ name: 'syntax_error_spec.js' })

    try {
      await preprocessor({})(file)
      throw new Error('Should not resolve')
    } catch (err) {
      expect(stripAnsi(normalizeErrMessage(err.message))).toMatchSnapshot()
    }
  })

  it('allows attaching catch later on syntax error without triggering unhandled rejection', async () => {
    process.on('unhandledRejection', (err) => {
      // @ts-expect-error
      // eslint-disable-next-line no-console
      console.error('Unhandled Rejection:', err.stack)
      throw new Error('Should not have trigger unhandled rejection')
    })

    file = createFile({ shouldWatch: true })

    await preprocessor({})(file)
    await fs.outputFile(file.filePath, '{')

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        preprocessor({})(file)
        .catch((err) => {
          expect(err.stack).to.include('Unexpected token')
          resolve()
        })
      }, 1000)
    })
  })

  it('triggers rerun on syntax error', async () => {
    file = createFile({ shouldWatch: true })

    await preprocessor({})(file)

    const _emit = vi.spyOn(file, 'emit')

    await fs.outputFile(file.filePath, '{')

    await retry(() => expect(_emit).toHaveBeenCalledWith('rerun'))
  })

  it('does not call rerun on initial build, but on subsequent builds', async () => {
    file = createFile({ shouldWatch: true })
    const _emit = vi.spyOn(file, 'emit')

    await preprocessor({})(file)

    expect(_emit).not.toHaveBeenCalledWith('rerun')

    await fs.outputFile(file.filePath, 'console.log()')

    await retry(() => expect(_emit).toHaveBeenCalledWith('rerun'))
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
