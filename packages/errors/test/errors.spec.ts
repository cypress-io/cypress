import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import chalk from 'chalk'
import * as errors from '../src'
import { parseResolvedPattern } from '../src/errorUtils'

// ANSI escape codes for color testing
const ansiStyles = {
  red: {
    open: '\u001b[31m',
    close: '\u001b[39m',
  },
  yellow: {
    open: '\u001b[33m',
    close: '\u001b[39m',
  },
} as const

describe('lib/errors', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let previousChalkLevel: 0 | 1 | 2 | 3

  beforeEach(() => {
    vi.resetAllMocks()
    vi.unstubAllEnvs()
    // turns chalk on
    previousChalkLevel = chalk.level
    chalk.level = 3
    // Mock console.log at the module boundary
    consoleErrorSpy = vi.spyOn(console, 'log')
  })

  afterEach(() => {
    chalk.level = previousChalkLevel
  })

  describe('.log', () => {
    it('uses red by default', () => {
      const err = errors.get('TESTS_DID_NOT_START_FAILED')

      const ret = errors.log(err)

      expect(ret).toBeUndefined()

      const {
        red,
      } = ansiStyles

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(red.open))

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(red.close))
    })

    it('can change the color', () => {
      const err = errors.get('TESTS_DID_NOT_START_FAILED')

      const ret = errors.log(err, 'yellow')

      expect(ret).toBeUndefined()

      const {
        yellow,
      } = ansiStyles

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(yellow.open))

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(yellow.close))
    })

    it('logs err.message', () => {
      const err = errors.getError('NO_PROJECT_ID', '/path/to/project/cypress.config.js')

      const ret = errors.log(err)

      expect(ret).toBeUndefined()

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('/path/to/project/cypress.config.js'))
    })

    it('logs err.details', () => {
      const userError = new Error('asdf')

      const err = errors.get('CONFIG_FILE_UNEXPECTED_ERROR', 'foo/bar/baz', userError)

      const ret = errors.log(err)

      expect(ret).toBeUndefined()

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('foo/bar/baz'))

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(chalk.magenta(userError.stack ?? '')))
    })

    describe('err.stack', () => {
      it('is logged if not a known Cypress error', () => {
        const err = new Error('foo')

        const ret = errors.log(err)

        expect(ret).toEqual(err)

        expect(consoleErrorSpy).toHaveBeenCalledWith(chalk.red(err.stack ?? ''))
      })

      it('is not logged if a known Cypress error', () => {
        const err = new Error('foo')

        err['isCypressErr'] = true

        const ret = errors.log(err)

        expect(ret).toBeUndefined()

        expect(consoleErrorSpy).not.toHaveBeenCalledWith(chalk.red(err.stack ?? ''))
      })
    })

    describe('err.cause', () => {
      let err

      beforeEach(() => {
        err = new Error('foo')
        err['cause'] = err
      })

      it('is not logged if a known Cypress error', () => {
        err['isCypressErr'] = true

        const ret = errors.log(err)

        expect(ret).toBeUndefined()

        expect(consoleErrorSpy).not.toHaveBeenCalledWith(chalk.red('Caused by:'))
      })

      it('is not logged if max cause depth === 0', () => {
        const ret = errors.log(err, 'red', 0)

        expect(ret).toEqual(ret)

        expect(consoleErrorSpy).not.toHaveBeenCalledWith(chalk.red('Caused by:'))
      })

      it('is logged to a specified max depth', () => {
        const ret = errors.log(err, 'red', 5)

        expect(ret).toEqual(err)

        const consoleErrorSpyCalls = consoleErrorSpy.mock.calls.filter((call) => call[0] === chalk.red('Caused by:'))

        expect(consoleErrorSpyCalls).toHaveLength(5)
      })
    })
  })

  describe('.clone', () => {
    it('converts err.message from ansi to html with span classes when html true', () => {
      const err = new Error(`foo${chalk.blue('bar')}${chalk.yellow('baz')}`)
      const obj = errors.cloneErr(err, { html: true })

      expect(obj.message).toEqual('foo<span class="ansi-blue-fg">bar</span><span class="ansi-yellow-fg">baz</span>')
    })

    it('does not convert err.message from ansi to html when no html option', () => {
      const err = new Error(`foo${chalk.blue('bar')}${chalk.yellow('baz')}`)
      const obj = errors.cloneErr(err)

      expect(obj.message).toEqual('foo\u001b[34mbar\u001b[39m\u001b[33mbaz\u001b[39m')
    })
  })

  describe('.parseResolvedPattern', () => {
    const folderPath = '/dev/cypress/packages/server'

    it('splits common paths', () => {
      const pattern = '/dev/cypress/packages/server/cypress/integration/**notfound**'

      const [resolvedBasePath, resolvedPattern] = parseResolvedPattern(folderPath, pattern)

      expect(resolvedBasePath).toEqual('/dev/cypress/packages/server')
      expect(resolvedPattern).toEqual('cypress/integration/**notfound**')
    })

    it('splits common paths factoring in ../', () => {
      const pattern = '/dev/cypress/packages/server/../../integration/**notfound**'

      const [resolvedBasePath, resolvedPattern] = parseResolvedPattern(folderPath, pattern)

      expect(resolvedBasePath).toEqual('/dev/cypress')
      expect(resolvedPattern).toEqual('integration/**notfound**')
    })

    it('splits common paths until falsy instead of doing an intersection', () => {
      const pattern = '/private/var/cypress/integration/cypress/integration/**notfound**'

      const [resolvedBasePath, resolvedPattern] = parseResolvedPattern(folderPath, pattern)

      expect(resolvedBasePath).toEqual('')
      expect(resolvedPattern).toEqual('/private/var/cypress/integration/cypress/integration/**notfound**')
    })

    it('splits common paths up directories until root is reached', () => {
      const pattern = '/../../../../../../../cypress/integration/**notfound**'

      const [resolvedBasePath, resolvedPattern] = parseResolvedPattern(folderPath, pattern)

      expect(resolvedBasePath).toEqual('')
      expect(resolvedPattern).toEqual('/cypress/integration/**notfound**')
    })
  })
})
