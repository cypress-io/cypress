import ipcBus from '../../src/lib/ipc-bus'

const RANDOM_NUMBER = 0.5

describe('IPC bus', () => {
  beforeEach(() => {
    cy.stub(Math, 'random').returns(RANDOM_NUMBER)
    cy.stub(window.ipc, 'on').returns()
    cy.stub(window.ipc, 'send').returns()
  })

  it('sends event as expected', () => {
    ipcBus('foo:bar', 'baz', 'quux')

    expect(window.ipc.send).to.be.calledWith('request', RANDOM_NUMBER, 'foo:bar', 'baz', 'quux')
  })

  it('removes functions & elements from the args', () => {
    const obj = {
      el: document.querySelector('div'),
      fn: () => {},
      str: 'foo',
    }

    ipcBus('bar', obj)

    expect(window.ipc.send).to.be.calledWith('request', RANDOM_NUMBER, 'bar', {
      el: null,
      fn: null,
      str: 'foo',
    })
  })
})
