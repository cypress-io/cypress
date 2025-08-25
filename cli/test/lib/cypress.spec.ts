import { vi, beforeEach, describe, it, expect } from 'vitest'
import os from 'os'
import path from 'path'
import type Open from '../../lib/exec/open'
import type Run from '../../lib/exec/run'
import type Cypress from '../../lib/cypress'

describe('cypress', function () {
  let cypress: typeof Cypress

  beforeEach(function () {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  describe('.open', function () {
    let open: typeof Open

    beforeEach(async function () {
      vi.doMock('../../lib/exec/open', async (importActual) => {
        const actual = await importActual()

        return {
          // @ts-expect-error
          ...actual,
          default: {
            // @ts-expect-error
            ...actual.default,
            start: vi.fn(),
          },
        }
      })

      open = (await import('../../lib/exec/open')).default
      cypress = (await import('../../lib/cypress')).default
    })

    it('calls open#start, passing in options', async function () {
      await cypress.open({ foo: 'foo' })

      expect(open.start).toHaveBeenCalledWith({ foo: 'foo' })
    })

    it('normalizes config object', async () => {
      const config = {
        pageLoadTime: 10000,
        watchForFileChanges: false,
      }

      await cypress.open({ config })

      expect(open.start).toHaveBeenCalledWith({ config: JSON.stringify(config) })
    })
  })

  describe('.run fails to write results file', function () {
    it('resolves with error object', async function () {
      const outputPath = path.join(os.tmpdir(), 'cypress/monorepo/cypress_spec/output.json')

      vi.doMock('tmp', async (importActual) => {
        const actual = await importActual()

        return {
          // @ts-expect-error
          ...actual,
          default: {
            // @ts-expect-error
            ...actual.default,
            file: vi.fn(),
          },
        }
      })

      const tmp = (await import('tmp')).default

      // @ts-expect-error
      tmp.file.mockReturnValue(outputPath)

      vi.doMock('../../lib/exec/run', async (importActual) => {
        const actual = await importActual()

        return {
          // @ts-expect-error
          ...actual,
          default: {
            // @ts-expect-error
            ...actual.default,
            start: vi.fn(),
          },
        }
      })

      const run = (await import('../../lib/exec/run')).default

      // @ts-expect-error
      run.start.mockResolvedValue(2)

      vi.doMock('../../lib/fs', async (importActual) => {
        const actual = await importActual()

        return {
          // @ts-expect-error
          ...actual,
          default: {
            // @ts-expect-error
            ...actual.default,
            readJson: vi.fn(),
          },
        }
      })

      const fs = (await import('../../lib/fs')).default

      fs.readJson.mockImplementation((args) => {
        if (args === outputPath) {
          return undefined
        }

        throw new Error('Could not find Cypress test run results')
      })

      const cypress = (await import('../../lib/cypress')).default

      const results = await cypress.run()

      expect(results).toEqual({
        status: 'failed',
        failures: 2,
        message: 'Could not find Cypress test run results',
      })
    })
  })

  describe('.run', function () {
    let outputPath: string
    let run: typeof Run

    beforeEach(async function () {
      outputPath = path.join(os.tmpdir(), 'cypress/monorepo/cypress_spec/output.json')

      vi.doMock('tmp', async (importActual) => {
        const actual = await importActual()

        return {
          // @ts-expect-error
          ...actual,
          default: {
            // @ts-expect-error
            ...actual.default,
            file: vi.fn(),
          },
        }
      })

      const tmp = (await import('tmp')).default

      // @ts-expect-error
      tmp.file.mockReturnValue(outputPath)

      vi.doMock('../../lib/exec/run', async (importActual) => {
        const actual = await importActual()

        return {
          // @ts-expect-error
          ...actual,
          default: {
            // @ts-expect-error
            ...actual.default,
            start: vi.fn(),
          },
        }
      })

      run = (await import('../../lib/exec/run')).default

      // @ts-expect-error
      run.start.mockResolvedValue(undefined)

      let fsOriginal: typeof fs

      vi.doMock('../../lib/fs', async (importActual) => {
        fsOriginal = await importActual()

        return {
          ...fsOriginal,
          default: {
            ...fsOriginal.default,
            readJson: vi.fn(),
          },
        }
      })

      const fs = (await import('../../lib/fs')).default

      fs.readJson.mockImplementation((args) => {
        if (args === outputPath) {
          return {
            code: 0,
            failingTests: [],
          }
        }

        return fsOriginal.default.readJson(args)
      })

      cypress = (await import('../../lib/cypress')).default
    })

    it('calls run#start, passing in options', async () => {
      await cypress.run({ spec: 'foo', autoCancelAfterFailures: 4 })

      expect(run.start).toHaveBeenCalledWith({
        outputPath,
        spec: 'foo',
        autoCancelAfterFailures: 4,
      })
    })

    it('calls run#start, passing in autoCancelAfterFailures false', async () => {
      await cypress.run({ autoCancelAfterFailures: false })

      expect(run.start).toHaveBeenCalledWith({
        outputPath,
        autoCancelAfterFailures: false,
      })
    })

    it('calls run#start, passing in autoCancelAfterFailures 0', async () => {
      await cypress.run({ autoCancelAfterFailures: 0 })

      expect(run.start).toHaveBeenCalledWith({
        outputPath,
        autoCancelAfterFailures: 0,
      })
    })

    it('normalizes config object', async () => {
      const config = {
        pageLoadTime: 10000,
        watchForFileChanges: false,
      }

      await cypress.run({ config })

      expect(run.start).toHaveBeenCalledWith({
        outputPath,
        config: JSON.stringify(config),
      })
    })

    it('normalizes env option if passed an object', async () => {
      const env = { foo: 'bar', another: 'one' }

      await cypress.run({ env })

      expect(run.start).toHaveBeenCalledWith({
        outputPath,
        env: JSON.stringify(env),
      })
    })

    it('gets random tmp file and passes it to run#start', async () => {
      await cypress.run()

      expect(run.start).toHaveBeenCalledWith(expect.objectContaining({
        outputPath,
      }))
    })

    it('resolves with contents of tmp file', async () => {
      const results = await cypress.run()

      expect(results).toMatchSnapshot()
    })

    it('rejects if project is an empty string', async () => {
      await expect(cypress.run({ project: '' })).rejects.toThrow()
    })

    it('rejects if project is true', async () => {
      await expect(cypress.run({ project: true })).rejects.toThrow()
    })

    it('rejects if project is false', async () => {
      await expect(cypress.run({ project: false })).rejects.toThrow()
    })

    it('passes quiet: true', async () => {
      await cypress.run({
        quiet: true,
      })

      expect(run.start).toHaveBeenCalledWith(expect.objectContaining({
        quiet: true,
      }))
    })
  })

  describe('cli', function () {
    describe('.parseRunArguments', function () {
      it('parses CLI cypress run arguments', async () => {
        const args = 'cypress run --browser chrome --spec my/test/spec.js'.split(' ')
        const options = await cypress.cli.parseRunArguments(args)

        expect(options).toEqual({
          browser: 'chrome',
          spec: 'my/test/spec.js',
        })
      })

      it('parses CLI cypress run shorthand arguments', async () => {
        const args = 'cypress run -b firefox -p 5005 --headed --quiet'.split(' ')
        const options = await cypress.cli.parseRunArguments(args)

        expect(options).toEqual({
          browser: 'firefox',
          port: 5005,
          headed: true,
          quiet: true,
        })
      })

      it('coerces --record and --dev', async () => {
        const args = 'cypress run --record false --dev true'.split(' ')
        const options = await cypress.cli.parseRunArguments(args)

        expect(options).toEqual({
          record: false,
          dev: true,
        })
      })

      it('coerces --config-file cypress.config.js to string', async () => {
        const args = 'cypress run --config-file cypress.config.js'.split(' ')
        const options = await cypress.cli.parseRunArguments(args)

        expect(options).toEqual({
          configFile: 'cypress.config.js',
        })
      })

      it('parses config', async () => {
        const args = 'cypress run --config baseUrl=localhost,video=true'.split(' ')
        const options = await cypress.cli.parseRunArguments(args)

        // we don't need to convert the config into an object
        // since the logic inside cypress.run handles that
        expect(options).toEqual({
          config: 'baseUrl=localhost,video=true',
        })
      })

      it('parses env', async () => {
        const args = 'cypress run --env MY_NUMBER=42,MY_FLAG=true'.split(' ')
        const options = await cypress.cli.parseRunArguments(args)

        // we don't need to convert the environment into an object
        // since the logic inside cypress.run handles that
        expect(options).toEqual({
          env: 'MY_NUMBER=42,MY_FLAG=true',
        })
      })
    })
  })
})
