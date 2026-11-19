/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect } from 'vitest'
import { PrimaryOriginCommunicator, SpecBridgeCommunicator } from '../../../src/cross-origin/communicator'

describe('PrimaryOriginCommunicator', () => {
  const fakeBridgeWindow = () => {
    const postMessage = vi.fn()

    return {
      postMessage,
      asWindow: { postMessage } as unknown as Window,
    }
  }

  it('clearCrossOriginDriverWindows stops subsequent toAllSpecBridges from messaging', () => {
    const comm = new PrimaryOriginCommunicator()
    const { postMessage, asWindow } = fakeBridgeWindow()

    comm.onMessage({
      data: { event: 'cross:origin:bridge:ready', origin: 'https://clear.example' },
      source: asWindow,
    })

    comm.toAllSpecBridges('sync:state', { duringUserTestExecution: false })
    expect(postMessage).toHaveBeenCalledOnce()

    comm.clearCrossOriginDriverWindows()
    postMessage.mockClear()

    comm.toAllSpecBridges('sync:state', { duringUserTestExecution: false })
    expect(postMessage).not.toHaveBeenCalled()
  })

  it('removeAllListeners() with no event clears cached spec bridge windows', () => {
    const comm = new PrimaryOriginCommunicator()
    const { postMessage, asWindow } = fakeBridgeWindow()

    comm.onMessage({
      data: { event: 'cross:origin:bridge:ready', origin: 'https://another.example' },
      source: asWindow,
    })

    comm.on('sync:during:user:test:execution', vi.fn())
    comm.removeAllListeners()

    expect(comm.listenerCount('sync:during:user:test:execution')).toBe(0)

    postMessage.mockClear()

    comm.toAllSpecBridges('sync:state', { duringUserTestExecution: false })
    expect(postMessage).not.toHaveBeenCalled()
  })

  it('removeAllListeners(undefined) does not clear all listeners or cached bridge windows', () => {
    const comm = new PrimaryOriginCommunicator()
    const { postMessage, asWindow } = fakeBridgeWindow()

    comm.onMessage({
      data: { event: 'cross:origin:bridge:ready', origin: 'https://explicit-undefined.example' },
      source: asWindow,
    })

    const handler = vi.fn()

    comm.on('sync:during:user:test:execution', handler)
    comm.removeAllListeners(undefined)

    expect(comm.listenerCount('sync:during:user:test:execution')).toBe(1)

    postMessage.mockClear()

    comm.toAllSpecBridges('sync:state', { duringUserTestExecution: false })
    expect(postMessage).toHaveBeenCalledOnce()
  })

  it('removeAllListeners(eventName) does not clear cached spec bridge windows', () => {
    const comm = new PrimaryOriginCommunicator()
    const { postMessage, asWindow } = fakeBridgeWindow()

    comm.onMessage({
      data: { event: 'cross:origin:bridge:ready', origin: 'https://keep.example' },
      source: asWindow,
    })

    comm.on('sync:during:user:test:execution', vi.fn())
    comm.removeAllListeners('sync:during:user:test:execution')

    postMessage.mockClear()

    comm.toAllSpecBridges('test:before:run', {})
    expect(postMessage).toHaveBeenCalledOnce()
  })
})

describe('SpecBridgeCommunicator', () => {
  const message = (overrides: MessageEventInit = {}) => {
    return new MessageEvent('message', {
      data: { event: 'sync:state', data: { duringUserTestExecution: true } },
      source: window.parent,
      ...overrides,
    })
  }

  it('emits messages from the parent window', () => {
    const comm = new SpecBridgeCommunicator()
    const handler = vi.fn()

    comm.on('sync:state', handler)
    comm.onMessage(message())

    expect(handler).toHaveBeenCalledWith({ duringUserTestExecution: true }, { responseEvent: undefined })
  })

  it('ignores messages from other windows', () => {
    const comm = new SpecBridgeCommunicator()
    const handler = vi.fn()

    const iframe = document.createElement('iframe')

    document.body.appendChild(iframe)

    comm.on('sync:state', handler)
    comm.onMessage(message({ source: iframe.contentWindow }))
    comm.onMessage(message({ source: null }))

    expect(handler).not.toHaveBeenCalled()
  })
})
