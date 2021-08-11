require('../../spec_helper')

const _ = require('lodash')
const os = require('os')
const getProxyFromURI = require(`${lib}/tasks/getProxyFromURI`)

const stdout = require('../../support/stdout')

describe('lib/tasks/getProxyFromURI', function () {
  require('mocha-banner').register()

  const testUri = new URL('https://anything.com')

  beforeEach(function () {
    this.stdout = stdout.capture()

    os.platform.returns('darwin')
  })

  afterEach(function () {
    stdout.restore()
  })

  context('with proxy env vars', () => {
    beforeEach(function () {
      this.env = _.clone(process.env)
      // add a default no_proxy which does not match the testUri
      process.env.NO_PROXY = 'localhost,.org'
    })

    afterEach(function () {
      process.env = this.env
    })

    it('prefers https_proxy over http_proxy', () => {
      process.env.HTTP_PROXY = 'foo'
      expect(getProxyFromURI(testUri)).to.eq('foo')
      process.env.https_proxy = 'bar'
      expect(getProxyFromURI(testUri)).to.eq('bar')
    })

    it('falls back to npm_config_proxy', () => {
      process.env.npm_config_proxy = 'foo'
      expect(getProxyFromURI(testUri)).to.eq('foo')
      process.env.npm_config_https_proxy = 'bar'
      expect(getProxyFromURI(testUri)).to.eq('bar')
      process.env.https_proxy = 'baz'
      expect(getProxyFromURI(testUri)).to.eq('baz')
    })

    it('respects no_proxy', () => {
      process.env.NO_PROXY = 'localhost,.com'

      process.env.HTTP_PROXY = 'foo'
      expect(getProxyFromURI(testUri)).to.eq(null)
      process.env.npm_config_https_proxy = 'bar'
      expect(getProxyFromURI(testUri)).to.eq(null)
      process.env.https_proxy = 'baz'
      expect(getProxyFromURI(testUri)).to.eq(null)
    })
  })
})
