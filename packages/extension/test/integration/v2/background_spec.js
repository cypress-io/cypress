require('../../spec_helper')
const http = require('http')
const socket = require('@packages/socket')
const mockRequire = require('mock-require')
const client = require('../../../app/v2/client')

const browser = {
  cookies: {
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
  runtime: {},
}

mockRequire('webextension-polyfill', browser)

const background = require('../../../app/v2/background')
const { expect } = require('chai')

const PORT = 12345

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
})
