/* eslint-disable
    brace-style,
    no-console,
    no-undef,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('../../support/unit_spec_helper')

const _ = require('lodash')
const Promise = require('bluebird')
const Cookies = require('js-cookie')
const $Cookies = require(`${src}/cypress/cookies`)

describe('src/cypress/cookies', () => {
  beforeEach(function () {
    jsdom.reconfigure({ url: 'http://localhost:3500' })

    this.Cookies = $Cookies.create('__cypress', 'localhost')

    this.setCookie = (key, value) => {
      return Cookies.set(key, value, { path: '/' })
    }
  })

  afterEach(() =>
  //# remove all cookies after each test
  {
    return _.each(Cookies.get(), (value, key) => {
      return Cookies.remove(key, { path: '/' })
    })
  })

  context('._set', () => {
    it('sets cookie value', function () {
      this.Cookies._set('foo', 'bar')

      expect(Cookies.get('foo')).to.eq('bar')
    })
  })

  //# TODO: fixme, something wrong
  //# with JSDOM and domain cookies
  context.skip('.setCy', () => {
    it('sets cypress cookie value', function () {
      this.Cookies.setCy('foo', 'bar')

      expect(this.Cookies._get('__cypress.foo')).to.eq('bar')
    })
  })

  context('._get', () => {
    it('gets cookie value', function () {
      this.Cookies._set('foo', 'bar')

      expect(this.Cookies._get('foo')).to.eq('bar')
    })
  })

  //# TODO: fixme, something wrong
  //# with JSDOM and domain cookies
  context.skip('.getCy', () => {
    it('gets cypress cookie value', function () {
      this.Cookies.setCy('foo', 'bar')

      expect(this.Cookies.getCy('foo')).to.eq('bar')
    })
  })

  context('.preserveOnce', () => {
    it('does not delete for one cycle', function () {
      this.Cookies.preserveOnce('foo')
      let cookies = this.Cookies.getClearableCookies([{ name: 'foo' }])

      expect(cookies).to.deep.eq([])
      cookies = this.Cookies.getClearableCookies([{ name: 'foo' }])

      expect(cookies).to.deep.eq([{ name: 'foo' }])
    })

    it('can preserve multiple keys', function () {
      this.Cookies.preserveOnce('foo', 'bar')
      let cookies = this.Cookies.getClearableCookies([{ name: 'foo' }, { name: 'bar' }])

      expect(cookies).to.deep.eq([])
      cookies = this.Cookies.getClearableCookies([{ name: 'foo' }, { name: 'bar' }])

      expect(cookies).to.deep.eq([{ name: 'foo' }, { name: 'bar' }])
    })
  })

  context('.log', () => {
    beforeEach(function () {
      this.Cookies.debug(false)

      this.sandbox.stub(console, 'info')

      return this.sandbox.stub(console, 'warn')
    })

    it('is noop without debugging', function () {
      expect(this.Cookies.log()).to.be.undefined
      expect(console.info).not.to.be.called

      expect(console.warn).not.to.be.called
    })

    it('warns when removed is true', function () {
      this.Cookies.debug()

      this.Cookies.log('asdf', {}, true)

      expect(console.warn).to.be.calledWith('asdf', {})
    })

    it('infos when removed is false', function () {
      this.Cookies.debug()

      this.Cookies.log('asdf', {}, false)

      expect(console.info).to.be.calledWith('asdf', {})
    })

    it('does not log the cookie when verbose is false', function () {
      this.Cookies.debug(true, { verbose: false })

      this.Cookies.log('asdf', {}, false)

      expect(console.info).to.be.calledWithExactly('asdf')
    })

    it('does not log the cookie when false and verbose is true', function () {
      this.Cookies.debug(false, { verbose: true })

      this.Cookies.log('asdf', {}, false)

      expect(console.info).not.to.be.called
    })
  })

  context('.defaults', () => {
    afterEach(function () {
      return this.Cookies.defaults({
        whitelist: null,
      })
    })

    it('can whitelist by string', function () {
      this.Cookies.defaults({
        whitelist: 'foo',
      })

      this.Cookies._set('foo', 'bar')
      const cookies = this.Cookies.getClearableCookies([{ name: 'foo' }])

      expect(cookies).to.deep.eq([])
    })

    it('can whitelist by array', function () {
      this.Cookies.defaults({
        whitelist: ['foo', 'baz'],
      })

      this.Cookies._set('foo', 'bar')
      this.Cookies._set('baz', 'quux')
      const cookies = this.Cookies.getClearableCookies([{ name: 'foo' }, { name: 'baz' }])

      expect(cookies).to.deep.eq([])
    })

    it('can whitelist by function', function () {
      this.Cookies.defaults({
        whitelist (cookie) {
          return /__foo/.test(cookie.name)
        },
      })

      this.Cookies._set('__foo', '1')
      this.Cookies._set('__foobar', '2')
      this.Cookies._set('lol__foo', '3')
      const cookies = this.Cookies.getClearableCookies([{ name: '__foo' }, { name: '__foobar' }, { name: 'lol_foo' }])

      expect(cookies).to.deep.eq([{ name: 'lol_foo' }])
    })

    it('can whitelist by regexp', function () {
      this.Cookies.defaults({
        whitelist: /bar/,
      })

      this.Cookies._set('bar', '1')
      this.Cookies._set('foobarbaz', '2')
      this.Cookies._set('baz', '3')
      const cookies = this.Cookies.getClearableCookies([{ name: 'bar' }, { name: 'foobarbaz' }, { name: 'baz' }])

      expect(cookies).to.deep.eq([{ name: 'baz' }])
    })
  })

  describe('removed methods', () => {
    return _.each(['set', 'get', 'remove', 'getAllCookies', 'clearCookies'], (method) => {
      it(`throws invoking Cypress.Cookies.${method}()`, function () {
        const fn = () => {
          return this.Cookies[method]()
        }

        expect(fn).to.throw(`\
The Cypress.Cookies.${method}() method has been removed.

Setting, getting, and clearing cookies is now an asynchronous operation.

Replace this call with the appropriate command such as:
  - cy.getCookie()
  - cy.getCookies()
  - cy.setCookie()
  - cy.clearCookie()
  - cy.clearCookies()\
`)
      })
    })
  })
})
