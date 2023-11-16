require('../spec_helper')

describe('app/v3/content', () => {
  let port
  let chrome
  let window

  before(() => {
    port = {
      onMessage: {
        addListener: sinon.stub(),
      },
      postMessage: sinon.stub(),
    }

    chrome = {
      runtime: {
        connect: sinon.stub().returns(port),
      },
    }

    global.chrome = chrome

    window = {
      addEventListener: sinon.stub(),
      postMessage: sinon.stub(),
    },

    global.window = window

    require('../../app/v3/content')
  })

  beforeEach(() => {
    port.postMessage.reset()
    window.postMessage.reset()
  })

  it('adds window message listener and port onMessage listener', () => {
    expect(window.addEventListener).to.be.calledWith('message', sinon.match.func)
    expect(port.onMessage.addListener).to.be.calledWith(sinon.match.func)
  })

  describe('messages from window (i.e Cypress)', () => {
    it('posts message to port if message is cypress:extension:activate:main:tab', () => {
      const data = { message: 'cypress:extension:activate:main:tab', url: 'the://url' }

      window.addEventListener.yield({ data, source: window })

      expect(port.postMessage).to.be.calledWith({
        message: 'activate:main:tab',
        url: 'the://url',
      })
    })

    it('is a noop if source is not the same window', () => {
      window.addEventListener.yield({ source: {} })

      expect(port.postMessage).not.to.be.called
    })

    it('is a noop if message is not cypress:extension:activate:main:tab', () => {
      const data = { message: 'unsupported' }

      window.addEventListener.yield({ data, source: window })

      expect(port.postMessage).not.to.be.called
    })
  })

  describe('messages from port (i.e. service worker)', () => {
    it('posts message to window', () => {
      port.onMessage.addListener.yield({ message: 'main:tab:activated' })

      expect(window.postMessage).to.be.calledWith({ message: 'cypress:extension:main:tab:activated' }, '*')
    })

    it('is a noop if message is not main:tab:activated', () => {
      const data = { message: 'unsupported' }

      port.onMessage.addListener.yield({ data, source: window })

      expect(window.postMessage).not.to.be.called
    })
  })
})
