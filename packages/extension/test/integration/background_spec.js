require('../spec_helper')
const _ = require('lodash')
const http = require('http')
const socket = require('@packages/socket')
const Promise = require('bluebird')
const mockRequire = require('mock-require')

const browser = {
  cookies: {
    set () {},
    getAll () {},
    remove () {},
    onChanged: {
      addListener () {},
    },
  },
  windows: {
    getLastFocused () {},
  },
  runtime: {

  },
  tabs: {
    query () {},
    executeScript () {},
    captureVisibleTab () {},
  },
}

mockRequire('webextension-polyfill', browser)

const background = require('../../app/background')

const PORT = 12345

const tab1 = {
  'active': false,
  'audible': false,
  'favIconUrl': 'http://localhost:2020/__cypress/static/img/favicon.ico',
  'height': 553,
  'highlighted': false,
  'id': 1,
  'incognito': false,
  'index': 0,
  'mutedInfo': {
    'muted': false,
  },
  'pinned': false,
  'selected': false,
  'status': 'complete',
  'title': 'foobar',
  'url': 'http://localhost:2020/__/#tests',
  'width': 1920,
  'windowId': 1,
}

const tab2 = {
  'active': true,
  'audible': false,
  'favIconUrl': 'http://localhost:2020/__cypress/static/img/favicon.ico',
  'height': 553,
  'highlighted': true,
  'id': 2,
  'incognito': false,
  'index': 1,
  'mutedInfo': {
    'muted': false,
  },
  'pinned': false,
  'selected': true,
  'status': 'complete',
  'title': 'foobar',
  'url': 'https://localhost:2020/__/#tests',
  'width': 1920,
  'windowId': 1,
}

const tab3 = {
  'active': true,
  'audible': false,
  'favIconUrl': 'http://localhost:2020/__cypress/static/img/favicon.ico',
  'height': 553,
  'highlighted': true,
  'id': 2,
  'incognito': false,
  'index': 1,
  'mutedInfo': {
    'muted': false,
  },
  'pinned': false,
  'selected': true,
  'status': 'complete',
  'title': 'foobar',
  'url': 'about:blank',
  'width': 1920,
  'windowId': 1,
}

describe('app/background', () => {
  beforeEach(function (done) {
    this.httpSrv = http.createServer()
    this.server = socket.server(this.httpSrv, { path: '/__socket.io' })

    return this.httpSrv.listen(PORT, done)
  })

  afterEach(function (done) {
    this.server.close()

    return this.httpSrv.close(() => {
      return done()
    })
  })

  context('.connect', () => {
    it('can connect', function (done) {
      this.server.on('connection', () => {
        return done()
      })

      return background.connect(`http://localhost:${PORT}`, '/__socket.io')
    })

    it('emits \'automation:client:connected\'', (done) => {
      const client = background.connect(`http://localhost:${PORT}`, '/__socket.io')

      sinon.spy(client, 'emit')

      return client.on('connect', _.once(() => {
        expect(client.emit).to.be.calledWith('automation:client:connected')

        return done()
      }))
    })

    it('listens to cookie changes', (done) => {
      const addListener = sinon.stub(browser.cookies.onChanged, 'addListener')
      const client = background.connect(`http://localhost:${PORT}`, '/__socket.io')

      return client.on('connect', _.once(() => {
        expect(addListener).to.be.calledOnce

        return done()
      }))
    })
  })

  context('onChanged', () => {
    it('does not emit when cause is overwrite', (done) => {
      const addListener = sinon.stub(browser.cookies.onChanged, 'addListener')
      const client = background.connect(`http://localhost:${PORT}`, '/__socket.io')

      sinon.spy(client, 'emit')

      return client.on('connect', _.once(() => {
        const fn = addListener.getCall(0).args[0]

        fn({ cause: 'overwrite' })

        expect(client.emit).not.to.be.calledWith('automation:push:request')

        return done()
      }))
    })

    it('emits \'automation:push:request\'', (done) => {
      const info = { cause: 'explicit', cookie: { name: 'foo', value: 'bar' } }

      sinon.stub(browser.cookies.onChanged, 'addListener').yieldsAsync(info)
      const client = background.connect(`http://localhost:${PORT}`, '/__socket.io')

      return client.on('connect', () => {
        return client.emit = _.once((req, msg, data) => {
          expect(req).to.eq('automation:push:request')
          expect(msg).to.eq('change:cookie')
          expect(data).to.deep.eq(info)

          return done()
        })
      })
    })
  })

  context('.getAll', () => {
    it('resolves with specific cookie properties', () => {
      sinon.stub(browser.cookies, 'getAll')
      .withArgs({ domain: 'localhost' })
      .resolves([
        { name: 'foo', value: 'f', path: '/', domain: 'localhost', secure: true, httpOnly: true, expirationDate: 123 },
        { name: 'bar', value: 'b', path: '/', domain: 'localhost', secure: false, httpOnly: false, expirationDate: 456 },
      ])

      return background.getAll({ domain: 'localhost' })
      .then((cookies) => {
        expect(cookies).to.deep.eq([
          { name: 'foo', value: 'f', path: '/', domain: 'localhost', secure: true, httpOnly: true, expirationDate: 123 },
          { name: 'bar', value: 'b', path: '/', domain: 'localhost', secure: false, httpOnly: false, expirationDate: 456 },
        ])
      })
    })
  })

  context('.query', () => {
    beforeEach(function () {
      this.code = 'var s; (s = document.getElementById(\'__cypress-string\')) && s.textContent'
    })

    it('resolves on the 1st tab', function () {
      sinon.stub(browser.tabs, 'query')
      .withArgs({ windowType: 'normal' })
      .resolves([tab1])

      sinon.stub(browser.tabs, 'executeScript')
      .withArgs(tab1.id, { code: this.code })
      .resolves(['1234'])

      return background.query({
        string: '1234',
        element: '__cypress-string',
      })
    })

    it('resolves on the 2nd tab', function () {
      sinon.stub(browser.tabs, 'query')
      .withArgs({ windowType: 'normal' })
      .resolves([tab1, tab2])

      sinon.stub(browser.tabs, 'executeScript')
      .withArgs(tab1.id, { code: this.code })
      .resolves(['foobarbaz'])
      .withArgs(tab2.id, { code: this.code })
      .resolves(['1234'])

      return background.query({
        string: '1234',
        element: '__cypress-string',
      })
    })

    it('filters out tabs that don\'t start with http', () => {
      sinon.stub(browser.tabs, 'query')
      .resolves([tab3])

      return background.query({
        string: '1234',
        element: '__cypress-string',
      })
      .then(() => {
        throw new Error('should have failed')
      }).catch((err) => {
        // we good if this hits
        expect(err).to.be.instanceof(Promise.RangeError)
      })
    })

    it('rejects if no tab matches', function () {
      sinon.stub(browser.tabs, 'query')
      .withArgs({ windowType: 'normal' })
      .resolves([tab1, tab2])

      sinon.stub(browser.tabs, 'executeScript')
      .withArgs(tab1.id, { code: this.code })
      .resolves(['foobarbaz'])
      .withArgs(tab2.id, { code: this.code })
      .resolves(['foobarbaz2'])

      return background.query({
        string: '1234',
        element: '__cypress-string',
      })
      .then(() => {
        throw new Error('should have failed')
      }).catch((err) => {
        // we good if this hits
        expect(err.length).to.eq(2)

        expect(err).to.be.instanceof(Promise.AggregateError)
      })
    })

    it('rejects if no tabs were found', () => {
      sinon.stub(browser.tabs, 'query')
      .resolves([])

      return background.query({
        string: '1234',
        element: '__cypress-string',
      })
      .then(() => {
        throw new Error('should have failed')
      }).catch((err) => {
        // we good if this hits
        expect(err).to.be.instanceof(Promise.RangeError)
      })
    })
  })

  context('integration', () => {
    beforeEach(function (done) {
      done = _.once(done)
      this.server.on('connection', (socket1) => {
        this.socket = socket1

        return done()
      })

      this.client = background.connect(`http://localhost:${PORT}`, '/__socket.io')
    })

    describe('get:cookies', () => {
      beforeEach(() => {
        return sinon.stub(browser.cookies, 'getAll')
        .withArgs({ domain: 'google.com' })
        .resolves([{}, {}])
      })

      it('returns all cookies', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq([{}, {}])

          return done()
        })

        return this.server.emit('automation:request', 123, 'get:cookies', { domain: 'google.com' })
      })
    })

    describe('get:cookie', () => {
      beforeEach(() => {
        return sinon.stub(browser.cookies, 'getAll')
        .withArgs({ domain: 'google.com', name: 'session' })
        .resolves([
          { name: 'session', value: 'key', path: '/login', domain: 'google', secure: true, httpOnly: true, expirationDate: 123 },
        ])
        .withArgs({ domain: 'google.com', name: 'doesNotExist' })
        .resolves([])
      })

      it('returns a specific cookie by name', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq({ name: 'session', value: 'key', path: '/login', domain: 'google', secure: true, httpOnly: true, expirationDate: 123 })

          return done()
        })

        return this.server.emit('automation:request', 123, 'get:cookie', { domain: 'google.com', name: 'session' })
      })

      it('returns null when no cookie by name is found', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.be.null

          return done()
        })

        return this.server.emit('automation:request', 123, 'get:cookie', { domain: 'google.com', name: 'doesNotExist' })
      })
    })

    describe('set:cookie', () => {
      beforeEach(() => {
        browser.runtime.lastError = { message: 'some error' }

        return sinon.stub(browser.cookies, 'set')
        .withArgs({ domain: 'google.com', name: 'session', value: 'key', path: '/', secure: false, url: 'http://google.com/' })
        .resolves(
          { name: 'session', value: 'key', path: '/', domain: 'google', secure: false, httpOnly: false },
        )
        .withArgs({ url: 'https://www.google.com', name: 'session', value: 'key' })
        .resolves(
          { name: 'session', value: 'key', path: '/', domain: 'google.com', secure: true, httpOnly: false },
        )
        // 'domain' cannot not set when it's localhost
        .withArgs({ name: 'foo', value: 'bar', secure: true, path: '/foo', url: 'https://localhost/foo' })
        .rejects({ message: 'some error' })
      })

      it('resolves with the cookie details', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq({ name: 'session', value: 'key', path: '/', domain: 'google', secure: false, httpOnly: false })

          return done()
        })

        return this.server.emit('automation:request', 123, 'set:cookie', { domain: 'google.com', name: 'session', secure: false, value: 'key', path: '/' })
      })

      it('does not set url when already present', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq({ name: 'session', value: 'key', path: '/', domain: 'google.com', secure: true, httpOnly: false })

          return done()
        })

        return this.server.emit('automation:request', 123, 'set:cookie', { url: 'https://www.google.com', name: 'session', value: 'key' })
      })

      it('rejects with error', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.__error).to.eq('some error')

          return done()
        })

        return this.server.emit('automation:request', 123, 'set:cookie', { name: 'foo', value: 'bar', domain: 'localhost', secure: true, path: '/foo' })
      })
    })

    describe('clear:cookies', () => {
      beforeEach(() => {
        browser.runtime.lastError = { message: 'some error' }

        sinon.stub(browser.cookies, 'getAll')
        .withArgs({ domain: 'google.com' })
        .resolves([
          { name: 'session', value: 'key', path: '/', domain: 'google.com', secure: true, httpOnly: true, expirationDate: 123 },
          { name: 'foo', value: 'bar', path: '/foo', domain: 'google.com', secure: false, httpOnly: false, expirationDate: 456 },
        ])
        .withArgs({ domain: 'should.throw' })
        .resolves([
          { name: 'shouldThrow', value: 'key', path: '/', domain: 'should.throw', secure: false, httpOnly: true, expirationDate: 123 },
        ])
        .withArgs({ domain: 'no.details' })
        .resolves([
          { name: 'shouldThrow', value: 'key', path: '/', domain: 'no.details', secure: false, httpOnly: true, expirationDate: 123 },
        ])

        return sinon.stub(browser.cookies, 'remove')
        .withArgs({ name: 'session', url: 'https://google.com/' })
        .resolves(
          { name: 'session', url: 'https://google.com/', storeId: '123' },
        )
        .withArgs({ name: 'foo', url: 'http://google.com/foo' })
        .resolves(
          { name: 'foo', url: 'https://google.com/foo', storeId: '123' },
        )
        .withArgs({ name: 'noDetails', url: 'http://no.details/' })
        .resolves(null)
        .withArgs({ name: 'shouldThrow', url: 'http://should.throw/' })
        .rejects({ message: 'some error' })
      })

      it('resolves with array of removed cookies', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq([
            { name: 'session', value: 'key', path: '/', domain: 'google.com', secure: true, httpOnly: true, expirationDate: 123 },
            { name: 'foo', value: 'bar', path: '/foo', domain: 'google.com', secure: false, httpOnly: false, expirationDate: 456 },
          ])

          return done()
        })

        return this.server.emit('automation:request', 123, 'clear:cookies', { domain: 'google.com' })
      })

      it('rejects with error thrown', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.__error).to.eq('some error')

          return done()
        })

        return this.server.emit('automation:request', 123, 'clear:cookies', { domain: 'should.throw' })
      })

      it('rejects when no details', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.__error).to.eq(`Removing cookie failed for: ${JSON.stringify({ url: 'http://no.details/', name: 'shouldThrow' })}`)

          return done()
        })

        return this.server.emit('automation:request', 123, 'clear:cookies', { domain: 'no.details' })
      })
    })

    describe('clear:cookie', () => {
      beforeEach(() => {
        browser.runtime.lastError = { message: 'some error' }

        sinon.stub(browser.cookies, 'getAll')
        .withArgs({ domain: 'google.com', name: 'session' })
        .resolves([
          { name: 'session', value: 'key', path: '/', domain: 'google.com', secure: true, httpOnly: true, expirationDate: 123 },
        ])
        .withArgs({ domain: 'google.com', name: 'doesNotExist' })
        .resolves([])
        .withArgs({ domain: 'cdn.github.com', name: 'shouldThrow' })
        .resolves([
          { name: 'shouldThrow', value: 'key', path: '/assets', domain: 'cdn.github.com', secure: false, httpOnly: true, expirationDate: 123 },
        ])

        return sinon.stub(browser.cookies, 'remove')
        .withArgs({ name: 'session', url: 'https://google.com/' })
        .resolves(
          { name: 'session', url: 'https://google.com/', storeId: '123' },
        )
        .withArgs({ name: 'shouldThrow', url: 'http://cdn.github.com/assets' })
        .rejects({ message: 'some error' })
      })

      it('resolves single removed cookie', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq(
            { name: 'session', value: 'key', path: '/', domain: 'google.com', secure: true, httpOnly: true, expirationDate: 123 },
          )

          return done()
        })

        return this.server.emit('automation:request', 123, 'clear:cookie', { domain: 'google.com', name: 'session' })
      })

      it('returns null when no cookie by name is found', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.be.null

          return done()
        })

        return this.server.emit('automation:request', 123, 'clear:cookie', { domain: 'google.com', name: 'doesNotExist' })
      })

      it('rejects with error', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.__error).to.eq('some error')

          return done()
        })

        return this.server.emit('automation:request', 123, 'clear:cookie', { domain: 'cdn.github.com', name: 'shouldThrow' })
      })
    })

    describe('is:automation:client:connected', () => {
      beforeEach(() => {
        return sinon.stub(browser.tabs, 'query')
        .withArgs({ url: 'CHANGE_ME_HOST/*', windowType: 'normal' })
        .resolves([])
      })

      it('queries url and resolve', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.be.undefined

          return done()
        })

        return this.server.emit('automation:request', 123, 'is:automation:client:connected')
      })
    })

    describe('take:screenshot', () => {
      beforeEach(() => {
        return sinon.stub(browser.windows, 'getLastFocused').resolves({ id: 1 })
      })

      afterEach(() => {
        return delete browser.runtime.lastError
      })

      it('resolves with screenshot', function (done) {
        sinon.stub(browser.tabs, 'captureVisibleTab')
        .withArgs(1, { format: 'png' })
        .resolves('foobarbaz')

        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.eq('foobarbaz')

          return done()
        })

        return this.server.emit('automation:request', 123, 'take:screenshot')
      })

      it('rejects with browser.runtime.lastError', function (done) {
        sinon.stub(browser.tabs, 'captureVisibleTab').withArgs(1, { format: 'png' }).rejects(new Error('some error'))

        this.socket.on('automation:response', (id, obj) => {
          expect(id).to.eq(123)
          expect(obj.__error).to.eq('some error')

          return done()
        })

        return this.server.emit('automation:request', 123, 'take:screenshot')
      })
    })
  })
})
