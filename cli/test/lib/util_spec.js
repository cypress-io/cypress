require('../spec_helper')

const os = require('os')
const tty = require('tty')
const snapshot = require('snap-shot-it')
const supportsColor = require('supports-color')
const proxyquire = require('proxyquire')

const util = require(`${lib}/util`)
const logger = require(`${lib}/logger`)

describe('util', () => {
  beforeEach(() => {
    sinon.stub(process, 'exit')
    sinon.stub(logger, 'error')
  })

  context('.stdoutLineMatches', () => {
    const { stdoutLineMatches } = util

    it('is a function', () => {
      expect(stdoutLineMatches).to.be.a.function
    })

    it('matches entire output', () => {
      const line = '444'

      expect(stdoutLineMatches(line, line)).to.be.true
    })

    it('matches a line in output', () => {
      const line = '444'
      const stdout = ['start', line, 'something else'].join('\n')

      expect(stdoutLineMatches(line, stdout)).to.be.true
    })

    it('matches a trimmed line in output', () => {
      const line = '444'
      const stdout = ['start', `  ${line} `, 'something else'].join('\n')

      expect(stdoutLineMatches(line, stdout)).to.be.true
    })

    it('does not find match', () => {
      const line = '445'
      const stdout = ['start', '444', 'something else'].join('\n')

      expect(stdoutLineMatches(line, stdout)).to.be.false
    })
  })

  context('.normalizeModuleOptions', () => {
    const { normalizeModuleOptions } = util

    it('does not change other properties', () => {
      const options = {
        foo: 'bar',
      }

      snapshot('others_unchanged', normalizeModuleOptions(options))
    })

    it('passes string env unchanged', () => {
      const options = {
        env: 'foo=bar',
      }

      snapshot('env_as_string', normalizeModuleOptions(options))
    })

    it('converts environment object', () => {
      const options = {
        env: {
          foo: 'bar',
          magicNumber: 1234,
          host: 'kevin.dev.local',
        },
      }

      snapshot('env_as_object', normalizeModuleOptions(options))
    })

    it('converts config object', () => {
      const options = {
        config: {
          baseUrl: 'http://localhost:2000',
          watchForFileChanges: false,
        },
      }

      snapshot('config_as_object', normalizeModuleOptions(options))
    })

    it('converts reporterOptions object', () => {
      const options = {
        reporterOptions: {
          mochaFile: 'results/my-test-output.xml',
          toConsole: true,
        },
      }

      snapshot('reporter_options_as_object', normalizeModuleOptions(options))
    })

    it('converts specs array', () => {
      const options = {
        spec: [
          'a', 'b', 'c',
        ],
      }

      snapshot('spec_as_array', normalizeModuleOptions(options))
    })

    it('does not convert spec when string', () => {
      const options = {
        spec: 'x,y,z',
      }

      snapshot('spec_as_string', normalizeModuleOptions(options))
    })
  })

  context('.supportsColor', () => {
    it('is true on obj return for stdout and stderr', () => {
      sinon.stub(supportsColor, 'stdout').value({})
      sinon.stub(supportsColor, 'stderr').value({})

      expect(util.supportsColor()).to.be.true
    })

    it('is false on false return for stdout', () => {
      delete process.env.CI

      sinon.stub(supportsColor, 'stdout').value(false)
      sinon.stub(supportsColor, 'stderr').value({})

      expect(util.supportsColor()).to.be.false
    })

    it('is false on false return for stderr', () => {
      delete process.env.CI

      sinon.stub(supportsColor, 'stdout').value({})
      sinon.stub(supportsColor, 'stderr').value(false)

      expect(util.supportsColor()).to.be.false
    })

    it('is true when running in CI', () => {
      process.env.CI = '1'
      sinon.stub(supportsColor, 'stdout').value(false)

      expect(util.supportsColor()).to.be.true
    })

    it('is false when NO_COLOR has been set', () => {
      process.env.CI = '1'
      process.env.NO_COLOR = '1'
      sinon.stub(supportsColor, 'stdout').value({})
      sinon.stub(supportsColor, 'stderr').value({})

      expect(util.supportsColor()).to.be.FALSE
    })
  })

  context('.getEnvOverrides', () => {
    it('returns object with colors + process overrides', () => {
      // shouldn't be stubbing 'what we own' but its easiest in this case
      sinon.stub(util, 'supportsColor').returns(true)
      sinon.stub(tty, 'isatty').returns(true)

      expect(util.getEnvOverrides()).to.deep.eq({
        FORCE_STDIN_TTY: '1',
        FORCE_STDOUT_TTY: '1',
        FORCE_STDERR_TTY: '1',
        FORCE_COLOR: '1',
        DEBUG_COLORS: '1',
        MOCHA_COLORS: '1',
      })

      util.supportsColor.returns(false)
      tty.isatty.returns(false)

      expect(util.getEnvOverrides()).to.deep.eq({
        FORCE_STDIN_TTY: '0',
        FORCE_STDOUT_TTY: '0',
        FORCE_STDERR_TTY: '0',
        FORCE_COLOR: '0',
        DEBUG_COLORS: '0',
      })
    })
  })

  context('.getForceTty', () => {
    it('forces when each stream is a tty', () => {
      sinon.stub(tty, 'isatty')
      .withArgs(0).returns(true)
      .withArgs(1).returns(true)
      .withArgs(2).returns(true)

      expect(util.getForceTty()).to.deep.eq({
        FORCE_STDIN_TTY: true,
        FORCE_STDOUT_TTY: true,
        FORCE_STDERR_TTY: true,
      })

      tty.isatty
      .withArgs(0).returns(false)
      .withArgs(1).returns(false)
      .withArgs(2).returns(false)

      expect(util.getForceTty()).to.deep.eq({
        FORCE_STDIN_TTY: false,
        FORCE_STDOUT_TTY: false,
        FORCE_STDERR_TTY: false,
      })
    })
  })

  context('.exit', () => {
    it('calls process.exit', () => {
      process.exit.withArgs(2).withArgs(0)
      util.exit(2)
      util.exit(0)
    })
  })

  context('.logErrorExit1', () => {
    it('calls logger.error and process.exit', () => {
      const err = new Error('foo')

      logger.error.withArgs('foo')
      process.exit.withArgs(1)

      util.logErrorExit1(err)
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

  context('.printNodeOptions', () => {
    describe('NODE_OPTIONS is not set', () => {

      it('does nothing if debug is not enabled', () => {
        const log = sinon.spy()

        log.enabled = false
        util.printNodeOptions(log)
        expect(log).not.have.been.called
      })

      it('prints message when debug is enabled', () => {
        const log = sinon.spy()

        log.enabled = true
        util.printNodeOptions(log)
        expect(log).to.be.calledWith('NODE_OPTIONS is not set')
      })
    })

    describe('NODE_OPTIONS is set', () => {
      beforeEach(() => {
        process.env.NODE_OPTIONS = 'foo'
      })

      it('does nothing if debug is not enabled', () => {
        const log = sinon.spy()

        log.enabled = false
        util.printNodeOptions(log)
        expect(log).not.have.been.called
      })

      it('prints value when debug is enabled', () => {
        const log = sinon.spy()

        log.enabled = true
        util.printNodeOptions(log)
        expect(log).to.be.calledWith('NODE_OPTIONS=%s', 'foo')
      })
    })
  })

  describe('.getOsVersionAsync', () => {
    let util
    let getos = sinon.stub().resolves(['distro-release'])

    beforeEach(() => {
      util = proxyquire(`${lib}/util`, { getos })
    })
    it('calls os.release on non-linux', () => {
      os.platform.returns('darwin')
      os.release.returns('some-release')
      util.getOsVersionAsync()
      .then(() => {
        expect(os.release).to.be.called
        expect(getos).to.not.be.called
      })
    })
    it('NOT calls os.release on linux', () => {
      os.platform.returns('linux')
      util.getOsVersionAsync()
      .then(() => {
        expect(os.release).to.not.be.called
        expect(getos).to.be.called
      })
    })
  })

  describe('.getEnv', () => {
    it('reads from package.json config', () => {
      process.env.npm_package_config_CYPRESS_FOO = 'bar'
      expect(util.getEnv('CYPRESS_FOO')).to.eql('bar')
    })
    it('reads from .npmrc config', () => {
      process.env.npm_config_CYPRESS_FOO = 'bar'
      expect(util.getEnv('CYPRESS_FOO')).to.eql('bar')
    })
    it('reads from env var', () => {
      process.env.CYPRESS_FOO = 'bar'
      expect(util.getEnv('CYPRESS_FOO')).to.eql('bar')
    })
    it('prefers env var over .npmrc config', () => {
      process.env.CYPRESS_FOO = 'bar'
      process.env.npm_config_CYPRESS_FOO = 'baz'
      expect(util.getEnv('CYPRESS_FOO')).to.eql('bar')
    })
    it('prefers .npmrc config over package config', () => {
      process.env.npm_package_config_CYPRESS_FOO = 'baz'
      process.env.npm_config_CYPRESS_FOO = 'bloop'
      expect(util.getEnv('CYPRESS_FOO')).to.eql('bloop')
    })
  })
})
