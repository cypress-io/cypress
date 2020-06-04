/* eslint-disable
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('../spec_helper')

describe('lib/konfig', () => {
  beforeEach(function () {
    this.env = process.env['CYPRESS_INTERNAL_ENV']

    this.setup = (env) => {
      process.env['CYPRESS_INTERNAL_ENV'] = env

      this.konfig = require(`${root}lib/konfig`)

      this.eq = (key, val) => {
        expect(this.konfig(key)).to.eq(val)
      }
    }
  })

  afterEach(function () {
    process.env['CYPRESS_INTERNAL_ENV'] = this.env

    return delete require.cache[require.resolve(`${root}lib/konfig`)]
  })

  it('does not set global.config', () => {
    delete global.config
    delete require.cache[require.resolve(`${root}lib/konfig`)]

    require(`${root}lib/konfig`)

    expect(global.config).not.to.be.ok
  })

  it('memoizes the result', () => {
    const env = process.env['NODE_ENV']

    process.env['NODE_ENV'] = 'development'
    const config = require(`${root}lib/konfig`)

    process.env['NODE_ENV'] = 'test'
    const config2 = require(`${root}lib/konfig`)

    expect(config).to.eq(config2)
  })

  it('does not add NODE_ENV to process env if input env did not contain one', () => {
    const env = process.env['NODE_ENV']

    delete process.env['NODE_ENV']
    delete require.cache[require.resolve(`${root}lib/konfig`)]
    expect(process.env.hasOwnProperty('NODE_ENV')).to.eq(false)
    const config = require(`${root}lib/konfig`)

    expect(process.env.hasOwnProperty('NODE_ENV')).to.eq(false)
    process.env['NODE_ENV'] = env
  })

  context('development', () => {
    beforeEach(function () {
      return this.setup('development')
    })

    it('api_url', function () {
      return this.eq('api_url', 'http://localhost:1234/')
    })
  })

  context('test', () => {
    beforeEach(function () {
      return this.setup('test')
    })

    it('api_url', function () {
      return this.eq('api_url', 'http://localhost:1234/')
    })
  })

  context('production', () => {
    beforeEach(function () {
      return this.setup('production')
    })

    it('api_url', function () {
      return this.eq('api_url', 'https://api.cypress.io/')
    })
  })
})
