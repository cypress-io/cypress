require('../spec_helper')

const util = require(`${lib}/util`)
const logger = require(`${lib}/logger`)
const snapshot = require('snap-shot-it')

describe('util', function () {
  beforeEach(function () {
    this.sandbox.stub(process, 'exit')
    this.sandbox.stub(logger, 'error')
  })

  context('stdoutLineMatches', () => {
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

  context('normalizeModuleOptions', () => {
    const { normalizeModuleOptions } = util

    it('does not change other properties', () => {
      const options = {
        foo: 'bar',
      }
      snapshot(normalizeModuleOptions(options))
    })

    it('passes string env unchanged', () => {
      const options = {
        env: 'foo=bar',
      }
      snapshot(normalizeModuleOptions(options))
    })

    it('converts environment object', () => {
      const options = {
        env: {
          foo: 'bar',
          magicNumber: 1234,
          host: 'kevin.dev.local',
        },
      }
      snapshot(normalizeModuleOptions(options))
    })

    it('converts config object', () => {
      const options = {
        config: {
          baseUrl: 'http://localhost:2000',
          watchForFileChanges: false,
        },
      }
      snapshot(normalizeModuleOptions(options))
    })
  })

  it('.exit', function () {
    util.exit(2)
    expect(process.exit).to.be.calledWith(2)

    util.exit(0)
    expect(process.exit).to.be.calledWith(0)
  })

  it('.logErrorExit1', function () {
    const err = new Error('foo')

    util.logErrorExit1(err)

    expect(process.exit).to.be.calledWith(1)
    expect(logger.error).to.be.calledWith('foo')
  })
})
