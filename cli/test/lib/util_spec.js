require('../spec_helper')

const snapshot = require('snap-shot-it')
const supportsColor = require('supports-color')

const util = require(`${lib}/util`)
const logger = require(`${lib}/logger`)

describe('util', function () {
  beforeEach(function () {
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

  context('.supportsColor', function () {
    it('is true on obj return for stderr', function () {
      const obj = {}
      sinon.stub(supportsColor, 'stderr').value(obj)

      expect(util.supportsColor()).to.be.true
    })

    it('is false on false return for stderr', function () {
      sinon.stub(supportsColor, 'stderr').value(false)

      expect(util.supportsColor()).to.be.false
    })
  })

  it('.exit', function () {
    process.exit.withArgs(2).withArgs(0)
    util.exit(2)
    util.exit(0)
  })

  it('.logErrorExit1', function () {
    const err = new Error('foo')

    logger.error.withArgs('foo')
    process.exit.withArgs(1)

    util.logErrorExit1(err)
  })

  describe('.isSemver', function () {
    it('is true with 3-digit version', function () {
      expect(util.isSemver('1.2.3')).to.equal(true)
    })
    it('is true with 2-digit version', function () {
      expect(util.isSemver('1.2')).to.equal(true)
    })
    it('is true with 1-digit version', function () {
      expect(util.isSemver('1')).to.equal(true)
    })
    it('is false with URL', function () {
      expect(util.isSemver('www.cypress.io/download/1.2.3')).to.equal(false)
    })
    it('is false with file path', function () {
      expect(util.isSemver('0/path/1.2.3/mypath/2.3')).to.equal(false)
    })
  })

  context('.printNodeOptions', function () {
    describe('NODE_OPTIONS is not set', function () {
      beforeEach(function () {
        this.node_options = process.env.NODE_OPTIONS
        delete process.env.NODE_OPTIONS
      })

      afterEach(function () {
        if (typeof this.node_options !== 'undefined') {
          process.env.NODE_OPTIONS = this.node_options
        }
      })

      it('does nothing if debug is not enabled', function () {
        const log = sinon.spy()
        log.enabled = false
        util.printNodeOptions(log)
        expect(log).not.have.been.called
      })

      it('prints message when debug is enabled', function () {
        const log = sinon.spy()
        log.enabled = true
        util.printNodeOptions(log)
        expect(log).to.be.calledWith('NODE_OPTIONS is not set')
      })
    })

    describe('NODE_OPTIONS is set', function () {
      beforeEach(function () {
        this.node_options = process.env.NODE_OPTIONS
        process.env.NODE_OPTIONS = 'foo'
      })

      afterEach(function () {
        if (typeof this.node_options !== 'undefined') {
          process.env.NODE_OPTIONS = this.node_options
        }
      })

      it('does nothing if debug is not enabled', function () {
        const log = sinon.spy()
        log.enabled = false
        util.printNodeOptions(log)
        expect(log).not.have.been.called
      })

      it('prints value when debug is enabled', function () {
        const log = sinon.spy()
        log.enabled = true
        util.printNodeOptions(log)
        expect(log).to.be.calledWith('NODE_OPTIONS=%s', 'foo')
      })
    })
  })
})
