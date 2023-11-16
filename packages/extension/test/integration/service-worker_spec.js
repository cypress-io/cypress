require('../spec_helper')

describe('app/v3/service-worker', () => {
  let chrome
  let port

  before(() => {
    chrome = {
      runtime: {
        onConnect: {
          addListener: sinon.stub(),
        },
      },
      tabs: {
        query: sinon.stub(),
        update: sinon.stub(),
      },
    }

    global.chrome = chrome

    require('../../app/v3/service-worker')
  })

  beforeEach(() => {
    chrome.tabs.query.reset()
    chrome.tabs.update.reset()

    port = {
      onMessage: {
        addListener: sinon.stub(),
      },
      postMessage: sinon.stub(),
    }
  })

  it('adds onConnect listener', () => {
    expect(chrome.runtime.onConnect.addListener).to.be.calledWith(sinon.match.func)
  })

  it('adds port onMessage listener', () => {
    chrome.runtime.onConnect.addListener.yield(port)

    expect(port.onMessage.addListener).to.be.calledWith(sinon.match.func)
  })

  it('updates the tab matching the url', async () => {
    chrome.runtime.onConnect.addListener.yield(port)
    chrome.tabs.query.resolves([{ id: 'tab-id', url: 'the://url' }])

    await port.onMessage.addListener.yield({ message: 'activate:main:tab', url: 'the://url' })[0]

    expect(chrome.tabs.update).to.be.calledWith('tab-id', { active: true })
  })

  it('is a noop if message is not activate:main:tab', async () => {
    chrome.runtime.onConnect.addListener.yield(port)

    await port.onMessage.addListener.yield({ message: 'unsupported' })[0]

    expect(chrome.tabs.update).not.to.be.called
  })

  it('is a noop if url does not match a tab', async () => {
    chrome.runtime.onConnect.addListener.yield(port)
    chrome.tabs.query.resolves([{ id: 'tab-id', url: 'the://url' }])

    await port.onMessage.addListener.yield({ message: 'activate:main:tab', url: 'different://url' })[0]

    expect(chrome.tabs.update).not.to.be.called
  })

  it('is a noop, logging the error, if activating the tab errors', async () => {
    sinon.spy(console, 'log')

    chrome.runtime.onConnect.addListener.yield(port)
    chrome.tabs.query.resolves([{ id: 'tab-id', url: 'the://url' }])

    const err = new Error('uh oh')

    chrome.tabs.update.rejects(err)

    await port.onMessage.addListener.yield({ message: 'activate:main:tab', url: 'the://url' })[0]

    // eslint-disable-next-line no-console
    expect(console.log).to.be.calledWith('Activating main Cypress tab errored:', err)
  })
})
