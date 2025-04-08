require('../../spec_helper')

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
      storage: {
        local: {
          set: sinon.stub(),
          get: sinon.stub(),
        },
      },
    }

    global.chrome = chrome

    require('../../../app/v3/service-worker')
  })

  beforeEach(() => {
    chrome.tabs.query.reset()
    chrome.tabs.update.reset()
    chrome.storage.local.set.reset()
    chrome.storage.local.get.reset()

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

  describe('on message', () => {
    beforeEach(() => {
      chrome.runtime.onConnect.addListener.yield(port)
    })

    describe('activate:main:tab', () => {
      const tab1 = { id: '1', url: 'the://url' }
      const tab2 = { id: '2', url: 'some://other.url' }

      beforeEach(() => {
        chrome.tabs.query.resolves([tab1, tab2])
      })

      describe('when there is a most recent url', () => {
        beforeEach(() => {
          chrome.storage.local.get.callsArgWith(1, { mostRecentUrl: tab1.url })
        })

        it('activates the tab matching the url', async () => {
          await port.onMessage.addListener.yield({ message: 'activate:main:tab' })[0]

          expect(chrome.tabs.update).to.be.calledWith(tab1.id, { active: true })
        })

        describe('but no tab matches the most recent url', () => {
          beforeEach(() => {
            chrome.tabs.query.reset()
            chrome.tabs.query.resolves([tab2])
          })

          it('does not try to activate any tabs', async () => {
            await port.onMessage.addListener.yield({ message: 'activate:main:tab' })[0]
            expect(chrome.tabs.update).not.to.be.called
          })
        })

        describe('and chrome throws an error while activating the tab', () => {
          let err

          beforeEach(() => {
            sinon.stub(console, 'log')
            err = new Error('uh oh')
            chrome.tabs.update.rejects(err)
          })

          it('is a noop, logging the error', async () => {
            await port.onMessage.addListener.yield({ message: 'activate:main:tab' })[0]

            // eslint-disable-next-line no-console
            expect(console.log).to.be.calledWith('Activating main Cypress tab errored:', err)
          })
        })
      })

      describe('when there is not a most recent url', () => {
        beforeEach(() => {
          chrome.storage.local.get.callsArgWith(1, {})
        })

        it('does not try to activate any tabs', async () => {
          await port.onMessage.addListener.yield({ message: 'activate:main:tab' })[0]
          expect(chrome.tabs.update).not.to.be.called
        })
      })
    })

    describe('url:changed', () => {
      it('sets the mostRecentUrl', async () => {
        const url = 'some://url'

        await port.onMessage.addListener.yield({ message: 'url:changed', url })[0]
        expect(chrome.storage.local.set).to.be.calledWith({ mostRecentUrl: url })
      })
    })

    it('is a noop if message is not a supported message', async () => {
      await port.onMessage.addListener.yield({ message: 'unsupported' })[0]

      expect(chrome.tabs.update).not.to.be.called
      expect(chrome.storage.local.set).not.to.be.called
    })
  })
})
