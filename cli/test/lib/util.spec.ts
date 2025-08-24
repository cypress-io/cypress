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

      expect(util.isBrokenGtkDisplay(text)).to.be.true
      // and not for the other messages
      expect(util.isBrokenGtkDisplay('display was set incorrectly')).to.be.false
    })
  })

  describe('.getGitHubIssueUrl', () => {
    it('returns url for issue number', () => {
      const url = util.getGitHubIssueUrl(4034)

      expect(url).to.equal('https://github.com/cypress-io/cypress/issues/4034')
    })

    it('throws for anything but a positive integer', () => {
      expect(() => {
        return util.getGitHubIssueUrl(4024)
      }).to.throw

      expect(() => {
        return util.getGitHubIssueUrl(-5)
      }).to.throw

      expect(() => {
        return util.getGitHubIssueUrl(5.19)
      }).to.throw
    })
  })

  describe('.stdoutLineMatches', () => {
    it('is a function', () => {
      expect(util.stdoutLineMatches).to.be.a('function')
    })

    it('matches entire output', () => {
      const line = '444'

      expect(util.stdoutLineMatches(line, line)).to.be.true
    })

    it('matches a line in output', () => {
      const line = '444'
      const stdout = ['start', line, 'something else'].join('\n')

      expect(util.stdoutLineMatches(line, stdout)).to.be.true
    })

    it('matches a trimmed line in output', () => {
      const line = '444'
      const stdout = ['start', `  ${line} `, 'something else'].join('\n')

      expect(util.stdoutLineMatches(line, stdout)).to.be.true
    })

    it('does not find match', () => {
      const line = '445'
      const stdout = ['start', '444', 'something else'].join('\n')

      expect(util.stdoutLineMatches(line, stdout)).to.be.false
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

      expect(utils.supportsColor()).to.be.true
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

      expect(utils.supportsColor()).to.be.false
    })

    it('is false on false return for stderr', () => {
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

      expect(util.supportsColor()).to.be.false
    })

    it('is true when running in CI', () => {
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

      expect(util.supportsColor()).to.be.true
    })

    it('is false when NO_COLOR has been set', () => {
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

      expect(util.supportsColor()).to.be.false
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

      // @ts-expect-error is a mock
      tty.isatty.mockImplementation(() => true)

      const util = (await import('../../lib/util')).default

      expect(util.getEnvOverrides()).to.deep.eq({
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

      // @ts-expect-error is a mock
      tty.isatty.mockImplementation(() => false)

      expect(util.getEnvOverrides()).to.deep.eq({
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

      // @ts-expect-error is a mock
      tty.isatty.mockImplementation((args) => {
        if (args === 0 || args === 1 || args === 2) {
          return true
        }

        return false
      })

      const util = (await import('../../lib/util')).default

      expect(util.getForceTty()).to.deep.eq({
        FORCE_STDIN_TTY: true,
        FORCE_STDOUT_TTY: true,
        FORCE_STDERR_TTY: true,
      })

      // @ts-expect-error is a mock
      tty.isatty.mockImplementation((args) => false)

      expect(util.getForceTty()).to.deep.eq({
        FORCE_STDIN_TTY: false,
        FORCE_STDOUT_TTY: false,
        FORCE_STDERR_TTY: false,
      })
    })
  })

  describe('.getOriginalNodeOptions', () => {
    it('copy NODE_OPTIONS to ORIGINAL_NODE_OPTIONS', async () => {
      vi.stubEnv('NODE_OPTIONS', '--require foo.js')

      const util = (await import('../../lib/util')).default

      expect(util.getOriginalNodeOptions({})).to.deep.eq({
        ORIGINAL_NODE_OPTIONS: '--require foo.js',
      })
    })
  })

  describe('.exit', () => {
    it('calls process.exit', async () => {
      // @ts-expect-error wrong signature for process.exit
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined)

      const util = (await import('../../lib/util')).default

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
      expect(util.isSemver('1.2.3')).to.equal(true)
    })

    it('is true with 2-digit version', () => {
      expect(util.isSemver('1.2')).to.equal(true)
    })

    it('is true with 1-digit version', () => {
      expect(util.isSemver('1')).to.equal(true)
    })

    it('is false with URL', () => {
      expect(util.isSemver('www.cypress.io/download/1.2.3')).to.equal(false)
    })

    it('is false with file path', () => {
      expect(util.isSemver('0/path/1.2.3/mypath/2.3')).to.equal(false)
    })
  })

  describe('.calculateEta', () => {
    it('Remaining eta is same as elapsed when 50%', () => {
      expect(util.calculateEta(50, 1000)).to.equal(1000)
    })

    it('Remaining eta is 0 when 100%', () => {
      expect(util.calculateEta(100, 500)).to.equal(0)
    })
  })

  describe('.convertPercentToPercentage', () => {
    it('converts to 100 when 1', () => {
      expect(util.convertPercentToPercentage(1)).to.equal(100)
    })

    it('strips out extra decimals', () => {
      expect(util.convertPercentToPercentage(0.37892)).to.equal(38)
    })

    it('returns 0 if null num', () => {
      expect(util.convertPercentToPercentage(null)).to.equal(0)
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

      vi.doMock('getos', async (importActual) => {
        return {
          default: vi.fn(),
        }
      })
    })

    it('calls os.release on non-linux', async () => {
      const os = (await import('os')).default
      const getOs = (await import('getos')).default

      // @ts-expect-error wrong signature for mock
      os.platform.mockImplementation(() => 'darwin')

      // @ts-expect-error wrong signature for mock
      os.release.mockImplementation(() => 'some-release')

      const util = (await import('../../lib/util')).default

      const result = await util.getOsVersionAsync()

      expect(os.release).toHaveBeenCalled()
      expect(result).to.equal('some-release')
      expect(getOs).not.toHaveBeenCalled()
    })

    it('NOT calls os.release on linux', async () => {
      const os = (await import('os')).default
      const getOs = (await import('getos')).default

      // @ts-expect-error wrong signature for mock
      os.platform.mockImplementation(() => 'linux')

      // @ts-expect-error wrong signature for mock
      os.release.mockImplementation(() => 'some-release')

      // @ts-expect-error wrong signature for mock
      getOs.mockImplementation(() => ['distro-release'])

      const util = (await import('../../lib/util')).default

      await util.getOsVersionAsync()

      expect(os.release).not.toHaveBeenCalled()

      expect(getOs).toHaveBeenCalled()
    })
  })

  describe('dequote', () => {
    it('removes double quotes', () => {
      expect(util.dequote('"foo"')).to.equal('foo')
    })

    it('keeps single quotes', () => {
      expect(util.dequote('\'foo\'')).to.equal('\'foo\'')
    })

    it('keeps unbalanced double quotes', () => {
      expect(util.dequote('"foo')).to.equal('"foo')
    })

    it('keeps inner double quotes', () => {
      expect(util.dequote('a"b"c')).to.equal('a"b"c')
    })

    it('passes empty strings', () => {
      expect(util.dequote('')).to.equal('')
    })

    it('keeps single double quote character', () => {
      expect(util.dequote('"')).to.equal('"')
    })
  })

  describe('.getEnv', () => {
    it('reads from package.json config', () => {
      vi.stubEnv('npm_package_config_CYPRESS_FOO', 'bar')
      expect(util.getEnv('CYPRESS_FOO')).to.eql('bar')
    })

    it('reads from .npmrc config', () => {
      vi.stubEnv('npm_config_CYPRESS_FOO', 'bar')
      expect(util.getEnv('CYPRESS_FOO')).to.eql('bar')
    })

    it('reads from env var', () => {
      vi.stubEnv('CYPRESS_FOO', 'bar')
      expect(util.getEnv('CYPRESS_FOO')).to.eql('bar')
    })

    it('prefers env var over .npmrc config', () => {
      vi.stubEnv('CYPRESS_FOO', 'bar')
      vi.stubEnv('npm_config_CYPRESS_FOO', 'baz')
      expect(util.getEnv('CYPRESS_FOO')).to.eql('bar')
    })

    it('prefers env var over .npmrc config even if it\'s an empty string', () => {
      vi.stubEnv('CYPRESS_FOO', '')
      vi.stubEnv('npm_config_CYPRESS_FOO', 'baz')
      expect(util.getEnv('CYPRESS_FOO')).to.eql('')
    })

    it('prefers .npmrc config over package config', () => {
      vi.stubEnv('npm_package_config_CYPRESS_FOO', 'baz')
      vi.stubEnv('npm_config_CYPRESS_FOO', 'bloop')
      expect(util.getEnv('CYPRESS_FOO')).to.eql('bloop')
    })

    it('prefers .npmrc config over package config even if it\'s an empty string', () => {
      vi.stubEnv('npm_package_config_CYPRESS_FOO', 'baz')
      vi.stubEnv('npm_config_CYPRESS_FOO', '')
      expect(util.getEnv('CYPRESS_FOO')).to.eql('')
    })

    it('npm config set should work', () => {
      vi.stubEnv('npm_config_cypress_foo_foo', 'bazz')
      expect(util.getEnv('CYPRESS_FOO_FOO')).to.eql('bazz')
    })

    it('throws on non-string name', () => {
      expect(() => {
        util.getEnv()
      }).to.throw()

      expect(() => {
        util.getEnv(42)
      }).to.throw()
    })

    describe('with trim = true', () => {
      it('trims returned string', () => {
        vi.stubEnv('FOO', '  bar  ')
        expect(util.getEnv('FOO', true)).to.equal('bar')
      })

      it('removes quotes from the returned string', () => {
        vi.stubEnv('FOO', '  "bar"  ')
        expect(util.getEnv('FOO', true)).to.equal('bar')
      })

      it('removes only single level of double quotes', () => {
        vi.stubEnv('FOO', '  ""bar""  ')
        expect(util.getEnv('FOO', true)).to.equal('"bar"')
      })

      it('keeps unbalanced double quote', () => {
        vi.stubEnv('FOO', '  "bar  ')
        expect(util.getEnv('FOO', true)).to.equal('"bar')
      })

      it('trims but does not remove single quotes', () => {
        vi.stubEnv('FOO', '  \'bar\'  ')
        expect(util.getEnv('FOO', true)).to.equal('\'bar\'')
      })

      it('keeps whitespace inside removed quotes', () => {
        vi.stubEnv('FOO', '"foo.txt "')
        expect(util.getEnv('FOO', true)).to.equal('foo.txt ')
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

      expect(result).to.deep.equal({
        group: 'my group name',
        ciBuildId: 'my ci build id',
      })
    })

    it('removes leftover double quotes', () => {
      const result = util.parseOpts({
        group: '"my group name"',
        ciBuildId: '"my ci build id"',
      })

      expect(result).to.deep.equal({
        group: 'my group name',
        ciBuildId: 'my ci build id',
      })
    })

    it('leaves unbalanced double quotes', () => {
      const result = util.parseOpts({
        group: 'my group name"',
        ciBuildId: '"my ci build id',
      })

      expect(result).to.deep.equal({
        group: 'my group name"',
        ciBuildId: '"my ci build id',
      })
    })

    it('works with unspecified options', () => {
      const result = util.parseOpts({
        // notice that "group" option is missing
        ciBuildId: '"my ci build id"',
      })

      expect(result).to.deep.equal({
        ciBuildId: 'my ci build id',
      })
    })
  })
})
