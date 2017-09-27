require('../spec_helper')

const util = require(`${lib}/util`)
const logger = require(`${lib}/logger`)
const snapshot = require('snap-shot-it')

describe('util', function () {
  beforeEach(function () {
    this.sandbox.stub(process, 'exit')
    this.sandbox.stub(logger, 'error')
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
