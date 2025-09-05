import { vi, describe, it, beforeEach, expect } from 'vitest'
import hasha from 'hasha'
import la from 'lazy-ass'
import util from '../../lib/util'
import logger from '../../lib/logger'

describe('util', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  describe('.isBrokenGtkDisplay', () => {
    it('detects only GTK message', () => {
      const text = '[some noise here] Gtk: cannot open display: 99'

      expect(util.isBrokenGtkDisplay(text)).toEqual(true)
      // and not for the other messages
      expect(util.isBrokenGtkDisplay('display was set incorrectly')).toEqual(false)
    })
  })

  describe('.getGitHubIssueUrl', () => {
    it('returns url for issue number', () => {
      const url = util.getGitHubIssueUrl(4034)

      expect(url).toEqual('https://github.com/cypress-io/cypress/issues/4034')
    })

    it('throws for anything but a positive integer', () => {
      // @ts-expect-error
      expect(() => util.getGitHubIssueUrl('4024')).toThrow()

      expect(() => util.getGitHubIssueUrl(-5)).toThrow()

      expect(() => util.getGitHubIssueUrl(5.19)).toThrow()
    })
  })

  describe('.stdoutLineMatches', () => {
    it('is a function', () => {
      expect(util.stdoutLineMatches).toBeTypeOf('function')
    })

    it('matches entire output', () => {
      const line = '444'

      expect(util.stdoutLineMatches(line, line)).toEqual(true)
    })

    it('matches a line in output', () => {
      const line = '444'
      const stdout = ['start', line, 'something else'].join('\n')

      expect(util.stdoutLineMatches(line, stdout)).toEqual(true)
    })

    it('matches a trimmed line in output', () => {
      const line = '444'
      const stdout = ['start', `  ${line} `, 'something else'].join('\n')

      expect(util.stdoutLineMatches(line, stdout)).toEqual(true)
    })

    it('does not find match', () => {
      const line = '445'
      const stdout = ['start', '444', 'something else'].join('\n')

      expect(util.stdoutLineMatches(line, stdout)).toEqual(false)
    })
  })

  describe('.normalizeModuleOptions', () => {
    it('does not change other properties', () => {
      const options = {
        foo: 'bar',
      }

      expect(util.normalizeModuleOptions(options)).toMatchSnapshot()
    })

    it('passes string env unchanged', () => {
      const options = {
        env: 'foo=bar',
      }

      expect(util.normalizeModuleOptions(options)).toMatchSnapshot()
    })

    it('converts environment object', () => {
      const options = {
        env: {
          foo: 'bar',
          magicNumber: 1234,
          host: 'kevin.dev.local',
        },
      }

      expect(util.normalizeModuleOptions(options)).toMatchSnapshot()
    })

    it('converts config object', () => {
      const options = {
        config: {
          baseUrl: 'http://localhost:2000',
          watchForFileChanges: false,
        },
      }

      expect(util.normalizeModuleOptions(options)).toMatchSnapshot()
    })

    it('converts reporterOptions object', () => {
      const options = {
        reporterOptions: {
          mochaFile: 'results/my-test-output.xml',
          toConsole: true,
        },
      }

      expect(util.normalizeModuleOptions(options)).toMatchSnapshot()
    })

    it('converts specs array', () => {
      const options = {
        spec: [
          'a', 'b', 'c',
        ],
      }

      expect(util.normalizeModuleOptions(options)).toMatchSnapshot()
    })

    it('does not convert spec when string', () => {
      const options = {
        spec: 'x,y,z',
      }

      expect(util.normalizeModuleOptions(options)).toMatchSnapshot()
    })
  })

  describe('.supportsColor', () => {
    beforeEach(() => {
      // make sure CI is undefined when running in CircleCI to get deterministic results
      vi.stubEnv('CI', undefined)
    })

    it('is true on obj return for stdout and stderr', async () => {
      vi.doMock('supports-color', async (importActual) => {
        const actual = await importActual()

        return {
          // @ts-expect-error
          ...actual,
          default: {
            stdout: true,
            stderr: true,
          },
        }
      })

      const utils = (await import('../../lib/util')).default

      expect(utils.supportsColor()).toEqual(true)
    })

    it('is false on false return for stdout', async () => {
      vi.doMock('supports-color', async (importActual) => {
        const actual = await importActual()

        return {
          // @ts-expect-error
          ...actual,
          default: {
            stdout: false,
            stderr: true,
          },
        }
      })

      const utils = (await import('../../lib/util')).default

      expect(utils.supportsColor()).toEqual(false)
    })

    it('is false on false return for stderr', async () => {
      vi.doMock('supports-color', async (importActual) => {
        const actual = await importActual()

        return {
          // @ts-expect-error
          ...actual,
          default: {
            stdout: true,
            stderr: false,
          },
        }
      })

      const util = (await import('../../lib/util')).default

      expect(util.supportsColor()).toEqual(false)
    })

    it('is true when running in CI', async () => {
      vi.stubEnv('CI', '1')

      vi.doMock('supports-color', async (importActual) => {
        const actual = await importActual()

        return {
          // @ts-expect-error
          ...actual,
          default: {
            stdout: false,
            stderr: false,
          },
        }
      })

      const util = (await import('../../lib/util')).default

      expect(util.supportsColor()).toEqual(true)
    })

    it('is false when NO_COLOR has been set', async () => {
      vi.stubEnv('CI', '1')
      vi.stubEnv('NO_COLOR', '1')

      vi.doMock('supports-color', async (importActual) => {
        const actual = await importActual()

        return {
          // @ts-expect-error
          ...actual,
          default: {
            stdout: true,
            stderr: true,
          },
        }
      })

      const util = (await import('../../lib/util')).default

      expect(util.supportsColor()).toEqual(false)
    })
  })

  describe('.getEnvOverrides', () => {
    it('returns object with colors + process overrides', async () => {
      // force supportColors to return true
      vi.stubEnv('CI', '1')

      vi.doMock('tty', async (importActual) => {
        const actual = await importActual()

        return {
          // @ts-expect-error
          ...actual,
          default: {
            isatty: vi.fn(),
          },
        }
      })

      const tty = (await import('tty')).default

      // @ts-expect-error mockImplementation
      tty.isatty.mockReturnValue(true)

      const util = (await import('../../lib/util')).default

      expect(util.getEnvOverrides()).toEqual({
        FORCE_STDIN_TTY: '1',
        FORCE_STDOUT_TTY: '1',
        FORCE_STDERR_TTY: '1',
        FORCE_COLOR: '1',
        DEBUG_COLORS: '1',
        MOCHA_COLORS: '1',
      })

      // force supportColors to return false
      vi.stubEnv('CI', undefined)
      vi.stubEnv('NO_COLOR', '1')

      // @ts-expect-error - mockImplementation
      tty.isatty.mockReturnValue(false)

      expect(util.getEnvOverrides()).toEqual({
        FORCE_STDIN_TTY: '0',
        FORCE_STDOUT_TTY: '0',
        FORCE_STDERR_TTY: '0',
        FORCE_COLOR: '0',
        DEBUG_COLORS: '0',
      })
    })
  })

  describe('.getForceTty', () => {
    it('forces when each stream is a tty', async () => {
      vi.doMock('tty', async (importActual) => {
        const actual = await importActual()

        return {
          // @ts-expect-error
          ...actual,
          default: {
            isatty: vi.fn(),
          },
        }
      })

      const tty = (await import('tty')).default

      // @ts-expect-error mockImplementation
      tty.isatty.mockImplementation((args) => {
        if (args === 0 || args === 1 || args === 2) {
          return true
        }

        return false
      })

      const util = (await import('../../lib/util')).default

      expect(util.getForceTty()).toEqual({
        FORCE_STDIN_TTY: true,
        FORCE_STDOUT_TTY: true,
        FORCE_STDERR_TTY: true,
      })

      // @ts-expect-error mockImplementation
      tty.isatty.mockReturnValue(false)

      expect(util.getForceTty()).toEqual({
        FORCE_STDIN_TTY: false,
        FORCE_STDOUT_TTY: false,
        FORCE_STDERR_TTY: false,
      })
    })
  })

  describe('.getOriginalNodeOptions', () => {
    it('copy NODE_OPTIONS to ORIGINAL_NODE_OPTIONS', () => {
      vi.stubEnv('NODE_OPTIONS', '--require foo.js')

      // @ts-expect-error - bad type
      expect(util.getOriginalNodeOptions({})).toEqual({
        ORIGINAL_NODE_OPTIONS: '--require foo.js',
      })
    })
  })

  describe('.exit', () => {
    it('calls process.exit', () => {
      // @ts-expect-error wrong signature for process.exit
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined)

      util.exit(2)
      util.exit(0)

      expect(processExitSpy).toHaveBeenCalledWith(2)
      expect(processExitSpy).toHaveBeenCalledWith(0)
    })
  })

  describe('.logErrorExit1', () => {
    it('calls logger.error and process.exit', () => {
      const err = new Error('foo')
      // @ts-expect-error wrong signature for process.exit
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined)
      const loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined)

      util.logErrorExit1(err)

      expect(processExitSpy).toHaveBeenCalledWith(1)
      expect(loggerErrorSpy).toHaveBeenCalledWith('foo')
    })
  })

  describe('.isSemver', () => {
    it('is true with 3-digit version', () => {
      expect(util.isSemver('1.2.3')).toEqual(true)
    })

    it('is true with 2-digit version', () => {
      expect(util.isSemver('1.2')).toEqual(true)
    })

    it('is true with 1-digit version', () => {
      expect(util.isSemver('1')).toEqual(true)
    })

    it('is false with URL', () => {
      expect(util.isSemver('www.cypress.io/download/1.2.3')).toEqual(false)
    })

    it('is false with file path', () => {
      expect(util.isSemver('0/path/1.2.3/mypath/2.3')).toEqual(false)
    })
  })

  describe('.calculateEta', () => {
    it('Remaining eta is same as elapsed when 50%', () => {
      expect(util.calculateEta(50, 1000)).toEqual(1000)
    })

    it('Remaining eta is 0 when 100%', () => {
      expect(util.calculateEta(100, 500)).toEqual(0)
    })
  })

  describe('.convertPercentToPercentage', () => {
    it('converts to 100 when 1', () => {
      expect(util.convertPercentToPercentage(1)).toEqual(100)
    })

    it('strips out extra decimals', () => {
      expect(util.convertPercentToPercentage(0.37892)).toEqual(38)
    })

    it('returns 0 if null num', () => {
      expect(util.convertPercentToPercentage(null)).toEqual(0)
    })
  })

  describe('.printNodeOptions', () => {
    describe('NODE_OPTIONS is not set', () => {
      it('does nothing if debug is not enabled', () => {
        const log = vi.fn()

        // @ts-expect-error wrong signature for mock
        log.enabled = false
        util.printNodeOptions(log)
        expect(log).not.toHaveBeenCalled()
      })

      it('prints message when debug is enabled', () => {
        const log = vi.fn()

        // @ts-expect-error wrong signature for mock
        log.enabled = true
        util.printNodeOptions(log)
        expect(log).toHaveBeenCalledWith('NODE_OPTIONS is not set')
      })
    })

    describe('NODE_OPTIONS is set', () => {
      beforeEach(() => {
        vi.stubEnv('NODE_OPTIONS', 'foo')
      })

      it('does nothing if debug is not enabled', () => {
        const log = vi.fn()

        // @ts-expect-error wrong signature for mock
        log.enabled = false
        util.printNodeOptions(log)
        expect(log).not.toHaveBeenCalled()
      })

      it('prints value when debug is enabled', () => {
        const log = vi.fn()

        // @ts-expect-error wrong signature for mock
        log.enabled = true
        util.printNodeOptions(log)
        expect(log).toHaveBeenCalledWith('NODE_OPTIONS=%s', 'foo')
      })
    })
  })

  describe('.getOsVersionAsync', () => {
    beforeEach(() => {
      vi.doMock('os', async (importActual) => {
        const actual = await importActual()

        return {
          // @ts-expect-error
          ...actual,
          default: {
            platform: vi.fn(),
            release: vi.fn(),
          },
        }
      })

      vi.doMock('systeminformation', async (importActual) => {
        const actual = await importActual()

        return {
          // @ts-expect-error
          ...actual,
          default: {
            osInfo: vi.fn(),
          },
        }
      })
    })

    it('calls os.release when systeminformation fails', async () => {
      const os = (await import('os')).default
      const si = (await import('systeminformation')).default

      // @ts-expect-error - mockReturnValue
      os.release.mockReturnValue('some-release')
      // @ts-expect-error - mockRejectedValue
      si.osInfo.mockRejectedValue(new Error('systeminformation failed'))

      const util = (await import('../../lib/util')).default

      const result = await util.getOsVersionAsync()

      expect(result).toEqual('some-release')
      expect(os.release).toHaveBeenCalled()
      expect(si.osInfo).toHaveBeenCalled()
    })

    it('uses systeminformation when it succeeds', async () => {
      const os = (await import('os')).default
      const si = (await import('systeminformation')).default

      // @ts-expect-error - mockResolvedValue
      si.osInfo.mockResolvedValue({
        distro: 'Ubuntu',
        release: '22.04',
      })

      const util = (await import('../../lib/util')).default

      const result = await util.getOsVersionAsync()

      expect(result).toEqual('Ubuntu - 22.04')
      expect(si.osInfo).toHaveBeenCalled()
      expect(os.release).not.toHaveBeenCalled()
    })

    it('falls back to os.release when systeminformation returns incomplete data', async () => {
      const os = (await import('os')).default
      const si = (await import('systeminformation')).default

      // @ts-expect-error - mockResolvedValue
      os.release.mockReturnValue('5.15.0')

      // @ts-expect-error - mockResolvedValue
      si.osInfo.mockResolvedValue({
        distro: 'Ubuntu',
        // missing release property
      })

      const util = (await import('../../lib/util')).default

      const result = await util.getOsVersionAsync()

      expect(result).toEqual('5.15.0')
      expect(si.osInfo).toHaveBeenCalled()
      expect(os.release).toHaveBeenCalled()
    })
  })

  describe('dequote', () => {
    it('removes double quotes', () => {
      expect(util.dequote('"foo"')).toEqual('foo')
    })

    it('keeps single quotes', () => {
      expect(util.dequote('\'foo\'')).toEqual('\'foo\'')
    })

    it('keeps unbalanced double quotes', () => {
      expect(util.dequote('"foo')).toEqual('"foo')
    })

    it('keeps inner double quotes', () => {
      expect(util.dequote('a"b"c')).toEqual('a"b"c')
    })

    it('passes empty strings', () => {
      expect(util.dequote('')).toEqual('')
    })

    it('keeps single double quote character', () => {
      expect(util.dequote('"')).toEqual('"')
    })
  })

  describe('.getEnv', () => {
    it('reads from package.json config', () => {
      vi.stubEnv('npm_package_config_CYPRESS_FOO', 'bar')
      expect(util.getEnv('CYPRESS_FOO')).toEqual('bar')
    })

    it('reads from .npmrc config', () => {
      vi.stubEnv('npm_config_CYPRESS_FOO', 'bar')
      expect(util.getEnv('CYPRESS_FOO')).toEqual('bar')
    })

    it('reads from env var', () => {
      vi.stubEnv('CYPRESS_FOO', 'bar')
      expect(util.getEnv('CYPRESS_FOO')).toEqual('bar')
    })

    it('prefers env var over .npmrc config', () => {
      vi.stubEnv('CYPRESS_FOO', 'bar')
      vi.stubEnv('npm_config_CYPRESS_FOO', 'baz')
      expect(util.getEnv('CYPRESS_FOO')).toEqual('bar')
    })

    it('prefers env var over .npmrc config even if it\'s an empty string', () => {
      vi.stubEnv('CYPRESS_FOO', '')
      vi.stubEnv('npm_config_CYPRESS_FOO', 'baz')
      expect(util.getEnv('CYPRESS_FOO')).toEqual('')
    })

    it('prefers .npmrc config over package config', () => {
      vi.stubEnv('npm_package_config_CYPRESS_FOO', 'baz')
      vi.stubEnv('npm_config_CYPRESS_FOO', 'bloop')
      expect(util.getEnv('CYPRESS_FOO')).toEqual('bloop')
    })

    it('prefers .npmrc config over package config even if it\'s an empty string', () => {
      vi.stubEnv('npm_package_config_CYPRESS_FOO', 'baz')
      vi.stubEnv('npm_config_CYPRESS_FOO', '')
      expect(util.getEnv('CYPRESS_FOO')).toEqual('')
    })

    it('npm config set should work', () => {
      vi.stubEnv('npm_config_cypress_foo_foo', 'bazz')
      expect(util.getEnv('CYPRESS_FOO_FOO')).toEqual('bazz')
    })

    it('throws on non-string name', () => {
      expect(() => util.getEnv()).toThrow()

      expect(() => util.getEnv(42)).toThrow()
    })

    describe('with trim = true', () => {
      it('trims returned string', () => {
        vi.stubEnv('FOO', '  bar  ')
        expect(util.getEnv('FOO', true)).toEqual('bar')
      })

      it('removes quotes from the returned string', () => {
        vi.stubEnv('FOO', '  "bar"  ')
        expect(util.getEnv('FOO', true)).toEqual('bar')
      })

      it('removes only single level of double quotes', () => {
        vi.stubEnv('FOO', '  ""bar""  ')
        expect(util.getEnv('FOO', true)).toEqual('"bar"')
      })

      it('keeps unbalanced double quote', () => {
        vi.stubEnv('FOO', '  "bar  ')
        expect(util.getEnv('FOO', true)).toEqual('"bar')
      })

      it('trims but does not remove single quotes', () => {
        vi.stubEnv('FOO', '  \'bar\'  ')
        expect(util.getEnv('FOO', true)).toEqual('\'bar\'')
      })

      it('keeps whitespace inside removed quotes', () => {
        vi.stubEnv('FOO', '"foo.txt "')
        expect(util.getEnv('FOO', true)).toEqual('foo.txt ')
      })
    })
  })

  describe('.getFileChecksum', () => {
    it('computes same hash as Hasha SHA512', async () => {
      const [checksum, expectedChecksum] = await Promise.all([
        util.getFileChecksum(__filename),
        hasha.fromFile(__filename, { algorithm: 'sha512' }),
      ])

      la(checksum === expectedChecksum, 'our computed checksum', checksum,
        'is different from expected', expectedChecksum)
    })
  })

  describe('parseOpts', () => {
    it('passes normal options and strips unknown ones', () => {
      const result = util.parseOpts({
        unknownOptions: true,
        group: 'my group name',
        ciBuildId: 'my ci build id',
      })

      expect(result).toEqual({
        group: 'my group name',
        ciBuildId: 'my ci build id',
      })
    })

    it('removes leftover double quotes', () => {
      const result = util.parseOpts({
        group: '"my group name"',
        ciBuildId: '"my ci build id"',
      })

      expect(result).toEqual({
        group: 'my group name',
        ciBuildId: 'my ci build id',
      })
    })

    it('leaves unbalanced double quotes', () => {
      const result = util.parseOpts({
        group: 'my group name"',
        ciBuildId: '"my ci build id',
      })

      expect(result).toEqual({
        group: 'my group name"',
        ciBuildId: '"my ci build id',
      })
    })

    it('works with unspecified options', () => {
      const result = util.parseOpts({
        // notice that "group" option is missing
        ciBuildId: '"my ci build id"',
      })

      expect(result).toEqual({
        ciBuildId: 'my ci build id',
      })
    })
  })
})
