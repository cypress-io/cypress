require('../spec_helper')

const os = require('os')
const tty = require('tty')
const snapshot = require('../support/snapshot')
const mockedEnv = require('mocked-env')
const supportsColor = require('supports-color')
const proxyquire = require('proxyquire')
const hasha = require('hasha')
const la = require('lazy-ass')

const util = require(`${lib}/util`)
const logger = require(`${lib}/logger`)

describe('util', () => {
  beforeEach(() => {
    sinon.stub(process, 'exit')
    sinon.stub(logger, 'error')
  })

  context('.isBrokenGtkDisplay', () => {
    it('detects only GTK message', () => {
      os.platform.returns('linux')
      const text = '[some noise here] Gtk: cannot open display: 99'

      expect(util.isBrokenGtkDisplay(text)).to.be.true
      // and not for the other messages
      expect(util.isBrokenGtkDisplay('display was set incorrectly')).to.be.false
    })
  })

  context('.getGitHubIssueUrl', () => {
    it('returns url for issue number', () => {
      const url = util.getGitHubIssueUrl(4034)

      expect(url).to.equal('https://github.com/cypress-io/cypress/issues/4034')
    })

    it('throws for anything but a positive integer', () => {
      expect(() => {
        return util.getGitHubIssueUrl('4034')
      }).to.throw

      expect(() => {
        return util.getGitHubIssueUrl(-5)
      }).to.throw

      expect(() => {
        return util.getGitHubIssueUrl(5.19)
      }).to.throw
    })
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

      snapshot('others_unchanged 1', normalizeModuleOptions(options))
    })

    it('passes string env unchanged', () => {
      const options = {
        env: 'foo=bar',
      }

      snapshot('env_as_string 1', normalizeModuleOptions(options))
    })

    it('converts environment object', () => {
      const options = {
        env: {
          foo: 'bar',
          magicNumber: 1234,
          host: 'kevin.dev.local',
        },
      }

      snapshot('env_as_object 1', normalizeModuleOptions(options))
    })

    it('converts config object', () => {
      const options = {
        config: {
          baseUrl: 'http://localhost:2000',
          watchForFileChanges: false,
        },
      }

      snapshot('config_as_object 1', normalizeModuleOptions(options))
    })

    it('converts reporterOptions object', () => {
      const options = {
        reporterOptions: {
          mochaFile: 'results/my-test-output.xml',
          toConsole: true,
        },
      }

      snapshot('reporter_options_as_object 1', normalizeModuleOptions(options))
    })

    it('converts specs array', () => {
      const options = {
        spec: [
          'a', 'b', 'c',
        ],
      }

      snapshot('spec_as_array 1', normalizeModuleOptions(options))
    })

    it('does not convert spec when string', () => {
      const options = {
        spec: 'x,y,z',
      }

      snapshot('spec_as_string 1', normalizeModuleOptions(options))
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

  context('.getOriginalNodeOptions', () => {
    let restoreEnv
    const sandbox = sinon.createSandbox()

    afterEach(() => {
      if (restoreEnv) {
        restoreEnv()
        restoreEnv = null
      }
    })

    it('copy NODE_OPTIONS to ORIGINAL_NODE_OPTIONS', () => {
      sandbox.stub(process.versions, 'node').value('v16.14.2')
      sandbox.stub(process.versions, 'openssl').value('1.0.0')

      restoreEnv = mockedEnv({
        NODE_OPTIONS: '--require foo.js',
      })

      expect(util.getOriginalNodeOptions({})).to.deep.eq({
        ORIGINAL_NODE_OPTIONS: '--require foo.js',
      })
    })

    // https://github.com/cypress-io/cypress/issues/18914
    it('includes --openssl-legacy-provider in Node 17+ w/ OpenSSL 3', () => {
      sandbox.stub(process.versions, 'node').value('v17.1.0')
      sandbox.stub(process.versions, 'openssl').value('3.0.0-quic')

      restoreEnv = mockedEnv({
        NODE_OPTIONS: '--require foo.js',
      })

      let childOptions = util.getOriginalNodeOptions()

      expect(childOptions.ORIGINAL_NODE_OPTIONS).to.eq('--require foo.js --openssl-legacy-provider')

      restoreEnv()
      restoreEnv = mockedEnv({})
      childOptions = util.getOriginalNodeOptions()

      expect(childOptions.ORIGINAL_NODE_OPTIONS).to.eq(' --openssl-legacy-provider')
    })

    // https://github.com/cypress-io/cypress/issues/19320
    it('does not include --openssl-legacy-provider in Node 17+ w/ OpenSSL 1', () => {
      sandbox.stub(process.versions, 'node').value('v17.1.0')
      sandbox.stub(process.versions, 'openssl').value('1.0.0')

      restoreEnv = mockedEnv({
        NODE_OPTIONS: '--require foo.js',
      })

      let childOptions = util.getOriginalNodeOptions()

      expect(childOptions.ORIGINAL_NODE_OPTIONS).to.eq('--require foo.js')
      expect(childOptions.ORIGINAL_NODE_OPTIONS).not.to.contain('--openssl-legacy-provider')

      restoreEnv()
      restoreEnv = mockedEnv({})
      childOptions = util.getOriginalNodeOptions()

      expect(childOptions.ORIGINAL_NODE_OPTIONS).to.be.undefined
    })

    // https://github.com/cypress-io/cypress/issues/18914
    it('does not include --openssl-legacy-provider in Node <=16', () => {
      sandbox.stub(process.versions, 'node').value('v16.14.2')
      sandbox.stub(process.versions, 'openssl').value('1.0.0')

      restoreEnv = mockedEnv({})

      let childOptions = util.getOriginalNodeOptions()

      expect(childOptions.ORIGINAL_NODE_OPTIONS).to.be.undefined

      restoreEnv = mockedEnv({
        NODE_OPTIONS: '--require foo.js',
      })

      childOptions = util.getOriginalNodeOptions()

      expect(childOptions.ORIGINAL_NODE_OPTIONS).to.eq('--require foo.js')
      expect(childOptions.ORIGINAL_NODE_OPTIONS).not.to.contain('--openssl-legacy-provider')
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

  describe('.calculateEta', () => {
    it('Remaining eta is same as elapsed when 50%', () => {
      expect(util.calculateEta('50', 1000)).to.equal(1000)
    })

    it('Remaining eta is 0 when 100%', () => {
      expect(util.calculateEta('100', 500)).to.equal(0)
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

    it('prefers env var over .npmrc config even if it\'s an empty string', () => {
      process.env.CYPRESS_FOO = ''
      process.env.npm_config_CYPRESS_FOO = 'baz'
      expect(util.getEnv('CYPRESS_FOO')).to.eql('')
    })

    it('prefers .npmrc config over package config', () => {
      process.env.npm_package_config_CYPRESS_FOO = 'baz'
      process.env.npm_config_CYPRESS_FOO = 'bloop'
      expect(util.getEnv('CYPRESS_FOO')).to.eql('bloop')
    })

    it('prefers .npmrc config over package config even if it\'s an empty string', () => {
      process.env.npm_package_config_CYPRESS_FOO = 'baz'
      process.env.npm_config_CYPRESS_FOO = ''
      expect(util.getEnv('CYPRESS_FOO')).to.eql('')
    })

    it('npm config set should work', () => {
      process.env.npm_config_cypress_foo_foo = 'bazz'
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

    context('with trim = true', () => {
      it('trims returned string', () => {
        process.env.FOO = '  bar  '
        expect(util.getEnv('FOO', true)).to.equal('bar')
      })

      it('removes quotes from the returned string', () => {
        process.env.FOO = '  "bar"  '
        expect(util.getEnv('FOO', true)).to.equal('bar')
      })

      it('removes only single level of double quotes', () => {
        process.env.FOO = '  ""bar""  '
        expect(util.getEnv('FOO', true)).to.equal('"bar"')
      })

      it('keeps unbalanced double quote', () => {
        process.env.FOO = '  "bar  '
        expect(util.getEnv('FOO', true)).to.equal('"bar')
      })

      it('trims but does not remove single quotes', () => {
        process.env.FOO = '  \'bar\'  '
        expect(util.getEnv('FOO', true)).to.equal('\'bar\'')
      })

      it('keeps whitespace inside removed quotes', () => {
        process.env.FOO = '"foo.txt "'
        expect(util.getEnv('FOO', true)).to.equal('foo.txt ')
      })
    })
  })

  context('.getFileChecksum', () => {
    it('computes same hash as Hasha SHA512', () => {
      return Promise.all([
        util.getFileChecksum(__filename),
        hasha.fromFile(__filename, { algorithm: 'sha512' }),
      ]).then(([checksum, expectedChecksum]) => {
        la(checksum === expectedChecksum, 'our computed checksum', checksum,
          'is different from expected', expectedChecksum)
      })
    })
  })

  context('parseOpts', () => {
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
