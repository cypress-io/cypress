/* tslint:disable:no-empty */
require('../../spec_helper')
const _ = require('lodash')
const http = require('http')
const socket = require('@packages/socket')
const Promise = require('bluebird')
const mockRequire = require('mock-require')
const client = require('../../../app/v2/client')

const browser = {
  cookies: {
    set () {},
    getAll () {},
    remove () {},
    onChanged: {
      addListener () {},
    },
  },
  downloads: {
    onCreated: {
      addListener () {},
    },
    onChanged: {
      addListener () {},
    },
  },
  windows: {
    getAll () {},
    getCurrent () {},
    getLastFocused () {},
    remove () {},
    update () {},
  },
  runtime: {},
  tabs: {
    create () {},
    query () {},
    executeScript () {},
    captureVisibleTab () {},
    remove () {},
  },
  browsingData: {
    remove () {},
  },
  webRequest: {
    onBeforeSendHeaders: {
      addListener () {},
    },
  },
}

mockRequire('webextension-polyfill', browser)

const background = require('../../../app/v2/background')
const { expect } = require('chai')

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
    global.window = {}

    this.httpSrv = http.createServer()
    this.server = socket.server(this.httpSrv, { path: '/__socket' })

    const ws = {
      on: sinon.stub(),
      emit: sinon.stub(),
    }

    sinon.stub(client, 'connect').returns(ws)

    browser.runtime.getBrowserInfo = sinon.stub().resolves({ name: 'Firefox' }),

    this.connect = async (options = {}) => {
      const ws = background.connect(`http://localhost:${PORT}`, '/__socket.io')

      // skip 'connect' and 'automation:client:connected' and trigger
      // the handler that kicks everything off
      await ws.on.withArgs('automation:config').args[0][1](options)

      return ws
    }

    this.httpSrv.listen(PORT, done)
  })

  afterEach(function (done) {
    this.server.close()

    this.httpSrv.close(() => {
      done()
    })
  })

  context('.connect', () => {
    it('emits \'automation:client:connected\'', async function () {
      const ws = background.connect(`http://localhost:${PORT}`, '/__socket.io')

      await ws.on.withArgs('connect').args[0][1]()

      expect(ws.emit).to.be.calledWith('automation:client:connected')
    })

    it('listens to cookie changes', async function () {
      const addListener = sinon.stub(browser.cookies.onChanged, 'addListener')

      await this.connect()

      expect(addListener).to.be.calledOnce
    })
  })

  context('cookies', () => {
    it('onChanged does not emit when cause is overwrite', async function () {
      const addListener = sinon.stub(browser.cookies.onChanged, 'addListener')
      const ws = await this.connect()
      const fn = addListener.getCall(0).args[0]

      fn({ cause: 'overwrite' })

      expect(ws.emit).not.to.be.calledWith('automation:push:request')
    })

    it('onChanged emits automation:push:request change:cookie', async function () {
      const info = { cause: 'explicit', cookie: { name: 'foo', value: 'bar' } }

      sinon.stub(browser.cookies.onChanged, 'addListener').yields(info)

      const ws = await this.connect()

      expect(ws.emit).to.be.calledWith('automation:push:request', 'change:cookie', info)
    })
  })

  context('downloads', () => {
    it('onCreated emits automation:push:request create:download', async function () {
      const downloadItem = {
        id: '1',
        filename: '/path/to/download.csv',
        mime: 'text/csv',
        url: 'http://localhost:1234/download.csv',
      }

      sinon.stub(browser.downloads.onCreated, 'addListener').yields(downloadItem)

      const ws = await this.connect()

      expect(ws.emit).to.be.calledWith('automation:push:request', 'create:download', {
        id: `${downloadItem.id}`,
        filePath: downloadItem.filename,
        mime: downloadItem.mime,
        url: downloadItem.url,
      })
    })

    it('onChanged emits automation:push:request complete:download', async function () {
      const downloadDelta = {
        id: '1',
        state: {
          current: 'complete',
        },
      }

      sinon.stub(browser.downloads.onChanged, 'addListener').yields(downloadDelta)

      const ws = await this.connect()

      expect(ws.emit).to.be.calledWith('automation:push:request', 'complete:download', {
        id: `${downloadDelta.id}`,
      })
    })

    it('onChanged emits automation:push:request canceled:download', async function () {
      const downloadDelta = {
        id: '1',
        state: {
          current: 'canceled',
        },
      }

      sinon.stub(browser.downloads.onChanged, 'addListener').yields(downloadDelta)

      const ws = await this.connect()

      expect(ws.emit).to.be.calledWith('automation:push:request', 'canceled:download', {
        id: `${downloadDelta.id}`,
      })
    })

    it('onChanged does not emit if state does not exist', async function () {
      const downloadDelta = {
        id: '1',
      }
      const addListener = sinon.stub(browser.downloads.onChanged, 'addListener')

      const ws = await this.connect()

      addListener.getCall(0).args[0](downloadDelta)

      expect(ws.emit).not.to.be.calledWith('automation:push:request')
    })

    it('onChanged does not emit if state.current is not "complete"', async function () {
      const downloadDelta = {
        id: '1',
        state: {
          current: 'inprogress',
        },
      }
      const addListener = sinon.stub(browser.downloads.onChanged, 'addListener')

      const ws = await this.connect()

      addListener.getCall(0).args[0](downloadDelta)

      expect(ws.emit).not.to.be.calledWith('automation:push:request')
    })

    it('does not add downloads listener if in non-Firefox browser', async function () {
      browser.runtime.getBrowserInfo = undefined

      const onCreated = sinon.stub(browser.downloads.onCreated, 'addListener')
      const onChanged = sinon.stub(browser.downloads.onChanged, 'addListener')

      await this.connect()

      expect(onCreated).not.to.be.called
      expect(onChanged).not.to.be.called
    })
  })

  context('add header to aut iframe requests', () => {
    beforeEach(() => {
      browser.runtime.getBrowserInfo = sinon.stub().resolves({ name: 'Firefox', version: '135.0.1' })
    })

    it('allows for CDP to be used as an escape hatch if BiDi would otherwise be enabled', async function () {
      sinon.stub(browser.webRequest.onBeforeSendHeaders, 'addListener')

      await this.connect({
        IS_CDP_FORCED_FOR_FIREFOX: true,
      })

      expect(browser.webRequest.onBeforeSendHeaders.addListener).to.be.called
    })

    context('BiDi enabled', () => {
      it('does not attach onBeforeSendHeaders listener if BiDi is enabled', async function () {
        sinon.stub(browser.webRequest.onBeforeSendHeaders, 'addListener')

        await this.connect()

        expect(browser.webRequest.onBeforeSendHeaders.addListener).not.to.be.called
      })
    })

    context('CDP enabled', () => {
      beforeEach(() => {
        browser.runtime.getBrowserInfo = sinon.stub().resolves({ name: 'Firefox', version: '134' })
      })

      it('does not add header if it is the top frame', async function () {
        const details = {
          parentFrameId: -1,
        }

        sinon.stub(browser.webRequest.onBeforeSendHeaders, 'addListener')

        await this.connect()

        const result = browser.webRequest.onBeforeSendHeaders.addListener.lastCall.args[0](details)

        expect(result).to.be.undefined
      })

      it('does not add header if it is a nested frame', async function () {
        const details = {
          parentFrameId: 12345,
        }

        sinon.stub(browser.webRequest.onBeforeSendHeaders, 'addListener')

        await this.connect()

        const result = browser.webRequest.onBeforeSendHeaders.addListener.lastCall.args[0](details)

        expect(result).to.be.undefined
      })

      it('does not add header if it is a spec frame request', async function () {
        const details = {
          parentFrameId: 0,
          type: 'sub_frame',
          url: '/__cypress/integration/spec.js',
        }

        sinon.stub(browser.webRequest.onBeforeSendHeaders, 'addListener')

        await this.connect()
        const result = browser.webRequest.onBeforeSendHeaders.addListener.lastCall.args[0](details)

        expect(result).to.be.undefined
      })

      it('appends X-Cypress-Is-AUT-Frame header to AUT iframe request', async function () {
        const details = {
          parentFrameId: 0,
          type: 'sub_frame',
          url: 'http://localhost:3000/index.html',
          requestHeaders: [
            { name: 'X-Foo', value: 'Bar' },
          ],
        }

        sinon.stub(browser.webRequest.onBeforeSendHeaders, 'addListener')

        await this.connect()
        const result = browser.webRequest.onBeforeSendHeaders.addListener.lastCall.args[0](details)

        expect(result).to.deep.equal({
          requestHeaders: [
            {
              name: 'X-Foo',
              value: 'Bar',
            },
            {
              name: 'X-Cypress-Is-AUT-Frame',
              value: 'true',
            },
          ],
        })
      })

      it('does not add before-headers listener if in non-Firefox browser', async function () {
        browser.runtime.getBrowserInfo = undefined

        const onBeforeSendHeaders = sinon.stub(browser.webRequest.onBeforeSendHeaders, 'addListener')

        await this.connect()

        expect(onBeforeSendHeaders).not.to.be.called
      })
    })
  })

  context('.getAll', () => {
    it('resolves with specific cookie properties', () => {
      sinon.stub(browser.cookies, 'getAll').resolves([
        { name: 'key1', value: 'value1', path: '/', domain: 'localhost', secure: true, httpOnly: true, expirationDate: 123 },
        { name: 'key2', value: 'value2', path: '/', domain: 'localhost', secure: false, httpOnly: false, expirationDate: 456 },
        { name: 'key3', value: 'value3', path: '/', domain: 'foobar.com', secure: false, httpOnly: false, expirationDate: 456 },
        { name: 'key4', value: 'value4', path: '/', domain: 'www.foobar.com', secure: false, httpOnly: false, expirationDate: 456 },
      ])

      return background.getAll({ domain: 'foobar.com' })
      .then((cookies) => {
        expect(cookies).to.deep.eq([
          { name: 'key3', value: 'value3', path: '/', domain: 'foobar.com', secure: false, httpOnly: false, expirationDate: 456 },
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
        randomString: '1234',
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
        randomString: '1234',
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

      client.connect.restore()

      this.server.on('connection', (socket1) => {
        this.socket = socket1

        done()
      })

      this.client = background.connect(`http://localhost:${PORT}`, '/__socket')
    })

    describe('get:cookies', () => {
      beforeEach(() => {
        sinon.stub(browser.cookies, 'getAll').resolves([
          { cookie: '1', domain: 'example.com' },
          { cookie: '2', domain: 'www.example.com' },
        ])
      })

      it('returns cookies that match filter', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq([{ cookie: '1', domain: 'example.com' }])

          done()
        })

        this.server.emit('automation:request', 123, 'get:cookies', { domain: 'example.com' })
      })

      it('returns all cookies if there is no filter', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq([
            { cookie: '1', domain: 'example.com' },
            { cookie: '2', domain: 'www.example.com' },
          ])

          done()
        })

        this.server.emit('automation:request', 123, 'get:cookies', {})
      })
    })

    describe('get:cookie', () => {
      beforeEach(() => {
        sinon.stub(browser.cookies, 'getAll').resolves([
          { name: 'session', value: 'key', path: '/login', domain: 'example.com', secure: true, httpOnly: true, expirationDate: 123 },
        ])
      })

      it('returns a specific cookie by name', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq({ name: 'session', value: 'key', path: '/login', domain: 'example.com', secure: true, httpOnly: true, expirationDate: 123 })

          done()
        })

        this.server.emit('automation:request', 123, 'get:cookie', { domain: 'example.com', name: 'session' })
      })

      it('returns null when no cookie by name is found', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.be.null

          done()
        })

        this.server.emit('automation:request', 123, 'get:cookie', { domain: 'example.com', name: 'doesNotExist' })
      })
    })

    describe('set:cookie', () => {
      beforeEach(() => {
        browser.runtime.lastError = { message: 'some error' }

        return sinon.stub(browser.cookies, 'set')
        .withArgs({ domain: 'example.com', name: 'session', value: 'key', path: '/', secure: false, url: 'http://example.com/' })
        .resolves(
          { name: 'session', value: 'key', path: '/', domain: 'example', secure: false, httpOnly: false },
        )
        .withArgs({ url: 'https://www.example.com', name: 'session', value: 'key' })
        .resolves(
          { name: 'session', value: 'key', path: '/', domain: 'example.com', secure: true, httpOnly: false },
        )
        // 'domain' cannot not set when it's localhost
        .withArgs({ name: 'foo', value: 'bar', secure: true, path: '/foo', url: 'https://localhost/foo' })
        .rejects({ message: 'some error' })
      })

      it('resolves with the cookie details', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq({ name: 'session', value: 'key', path: '/', domain: 'example', secure: false, httpOnly: false })

          done()
        })

        this.server.emit('automation:request', 123, 'set:cookie', { domain: 'example.com', name: 'session', secure: false, value: 'key', path: '/' })
      })

      it('does not set url when already present', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq({ name: 'session', value: 'key', path: '/', domain: 'example.com', secure: true, httpOnly: false })

          done()
        })

        this.server.emit('automation:request', 123, 'set:cookie', { url: 'https://www.example.com', name: 'session', value: 'key' })
      })

      it('rejects with error', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.__error).to.eq('some error')

          done()
        })

        this.server.emit('automation:request', 123, 'set:cookie', { name: 'foo', value: 'bar', domain: 'localhost', secure: true, path: '/foo' })
      })
    })

    describe('clear:cookies', () => {
      beforeEach(() => {
        browser.runtime.lastError = { message: 'some error' }

        return sinon.stub(browser.cookies, 'remove')
        .callsFake(function () {
          // eslint-disable-next-line no-console
          console.log('unstubbed browser.cookies.remove', ...arguments)
        })
        .withArgs({ url: 'https://example.com', name: 'foo' })
        .resolves(
          { name: 'session', url: 'https://example.com/', storeId: '123' },
        )
        .withArgs({ name: 'foo', url: 'http://example.com/foo' })
        .resolves(
          { name: 'foo', url: 'https://example.com/foo', storeId: '123' },
        )
        .withArgs({ name: 'noDetails', url: 'http://no.details' })
        .resolves(null)
        .withArgs({ name: 'shouldThrow', url: 'http://should.throw' })
        .rejects({ message: 'some error' })
      })

      it('resolves with array of removed cookies', function (done) {
        const cookieArr = [{ domain: 'example.com', name: 'foo', secure: true }]

        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq(cookieArr)

          done()
        })

        this.server.emit('automation:request', 123, 'clear:cookies', cookieArr)
      })

      it('rejects when no cookie.name', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.__error).to.contain('did not include a name')

          done()
        })

        this.server.emit('automation:request', 123, 'clear:cookies', [{ domain: 'should.throw' }])
      })

      it('rejects with error thrown in browser.cookies.remove', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.__error).to.eq('some error')

          done()
        })

        this.server.emit('automation:request', 123, 'clear:cookies', [{ domain: 'should.throw', name: 'shouldThrow' }])
      })

      it('doesnt fail when no found cookie', function (done) {
        const cookieArr = [{ domain: 'no.details', name: 'noDetails' }]

        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq(cookieArr)

          done()
        })

        this.server.emit('automation:request', 123, 'clear:cookies', cookieArr)
      })
    })

    describe('clear:cookie', () => {
      beforeEach(() => {
        browser.runtime.lastError = { message: 'some error' }

        sinon.stub(browser.cookies, 'getAll').resolves([
          { name: 'session', value: 'key', path: '/', domain: 'example.com', secure: true, httpOnly: true, expirationDate: 123 },
        ])

        return sinon.stub(browser.cookies, 'remove')
        .withArgs({ name: 'session', url: 'https://example.com/' })
        .resolves(
          { name: 'session', url: 'https://example.com/', storeId: '123' },
        )
        .withArgs({ name: 'shouldThrow', url: 'http://cdn.github.com/assets' })
        .rejects({ message: 'some error' })
      })

      it('resolves single removed cookie', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq(
            { name: 'session', value: 'key', path: '/', domain: 'example.com', secure: true, httpOnly: true, expirationDate: 123 },
          )

          done()
        })

        this.server.emit('automation:request', 123, 'clear:cookie', { domain: 'example.com', name: 'session' })
      })

      it('returns null when no cookie by name is found', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.be.null

          done()
        })

        this.server.emit('automation:request', 123, 'clear:cookie', { domain: 'example.com', name: 'doesNotExist' })
      })

      it('rejects with error', function (done) {
        browser.cookies.getAll.resolves([
          { name: 'shouldThrow', value: 'key', path: '/assets', domain: 'cdn.github.com', secure: false, httpOnly: true, expirationDate: 123 },
        ])

        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.__error).to.eq('some error')

          done()
        })

        this.server.emit('automation:request', 123, 'clear:cookie', { domain: 'cdn.github.com', name: 'shouldThrow' })
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

          done()
        })

        this.server.emit('automation:request', 123, 'is:automation:client:connected')
      })
    })

    describe('focus:browser:window', () => {
      beforeEach(() => {
        sinon.stub(browser.windows, 'getCurrent').resolves({ id: '10' })
        sinon.stub(browser.windows, 'update').withArgs('10', { focused: true }).resolves()
      })

      it('focuses the current window', function (done) {
        this.socket.on('automation:response', (id, obj = {}) => {
          expect(id).to.eq(123)
          expect(obj.response).to.be.undefined

          expect(browser.windows.getCurrent).to.be.called
          expect(browser.windows.update).to.be.called

          done()
        })

        this.server.emit('automation:request', 123, 'focus:browser:window')
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

          done()
        })

        this.server.emit('automation:request', 123, 'take:screenshot')
      })

      it('rejects with browser.runtime.lastError', function (done) {
        sinon.stub(browser.tabs, 'captureVisibleTab').withArgs(1, { format: 'png' }).rejects(new Error('some error'))

        this.socket.on('automation:response', (id, obj) => {
          expect(id).to.eq(123)
          expect(obj.__error).to.eq('some error')

          done()
        })

        this.server.emit('automation:request', 123, 'take:screenshot')
      })
    })

    describe('reset:browser:state', () => {
      beforeEach(() => {
        sinon.stub(browser.browsingData, 'remove').withArgs({}, { cache: true, cookies: true, downloads: true, formData: true, history: true, indexedDB: true, localStorage: true, passwords: true, pluginData: true, serviceWorkers: true }).resolves()
      })

      it('resets the browser state', function (done) {
        this.socket.on('automation:response', (id, obj) => {
          expect(id).to.eq(123)
          expect(obj.response).to.be.undefined

          expect(browser.browsingData.remove).to.be.called

          done()
        })

        this.server.emit('automation:request', 123, 'reset:browser:state')
      })
    })

    describe('reset:browser:tabs:for:next:spec', () => {
      beforeEach(() => {
        sinon.stub(browser.windows, 'getCurrent').withArgs({ populate: true }).resolves({ id: '10', tabs: [{ id: '1' }, { id: '2' }, { id: '3' }] })
        sinon.stub(browser.tabs, 'remove').withArgs(['1', '2', '3']).resolves()
        sinon.stub(browser.tabs, 'create').withArgs({ url: 'about:blank', active: false }).resolves({
          id: 'new-tab',
        })
      })

      // @see https://github.com/cypress-io/cypress/issues/29172 for Firefox versions 124 and up
      it('closes the tabs in the current browser window and creates a new "about:blank" tab', function (done) {
        sinon.stub(browser.windows, 'getAll').resolves([{ id: '10' }])

        this.socket.on('automation:response', (id, obj) => {
          expect(id).to.eq(123)
          expect(obj.response).to.be.undefined

          expect(browser.windows.getCurrent).to.be.called
          expect(browser.tabs.remove).to.be.calledWith(['1', '2', '3'])
          expect(browser.tabs.create).to.be.calledWith({ url: 'about:blank', active: false })

          done()
        })

        this.server.emit('automation:request', 123, 'reset:browser:tabs:for:next:spec')
      })

      it('closes any extra windows', function (done) {
        sinon.stub(browser.windows, 'getAll').resolves([{ id: '9' }, { id: '10' }, { id: '11' }])
        sinon.stub(browser.windows, 'remove').resolves()

        this.socket.on('automation:response', (id, obj) => {
          expect(id).to.eq(123)
          expect(obj.response).to.be.undefined

          expect(browser.windows.remove).to.be.calledWith('9')
          expect(browser.windows.remove).to.be.calledWith('11')
          expect(browser.windows.remove).not.to.be.calledWith('10')

          done()
        })

        this.server.emit('automation:request', 123, 'reset:browser:tabs:for:next:spec')
      })

      it('does not fail if we are unable to close the window', function (done) {
        sinon.stub(browser.windows, 'getAll').resolves([{ id: '9' }, { id: '10' }, { id: '11' }])
        sinon.stub(browser.windows, 'remove').rejects()

        this.socket.on('automation:response', (id, obj) => {
          expect(id).to.eq(123)
          expect(obj.response).to.be.undefined

          expect(browser.windows.remove).to.be.calledWith('9')
          expect(browser.windows.remove).to.be.calledWith('11')

          expect(browser.windows.remove).not.to.be.calledWith('10')
          done()
        })

        this.server.emit('automation:request', 123, 'reset:browser:tabs:for:next:spec')
      })

      it('does not fail if we are unable to retrieve the windows', function (done) {
        sinon.stub(browser.windows, 'getAll').rejects()
        sinon.stub(browser.windows, 'remove')

        this.socket.on('automation:response', (id, obj) => {
          expect(id).to.eq(123)
          expect(obj.response).to.be.undefined

          expect(browser.windows.remove).not.to.be.called
          done()
        })

        this.server.emit('automation:request', 123, 'reset:browser:tabs:for:next:spec')
      })
    })
  })
})
