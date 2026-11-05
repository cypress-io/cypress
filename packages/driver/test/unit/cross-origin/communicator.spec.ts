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
  const message = (overrides: Partial<MessageEvent> = {}) => {
    return {
      data: { event: 'sync:state', data: { duringUserTestExecution: true } },
      source: window.parent,
      origin: 'http://localhost:3500',
      ...overrides,
    } as MessageEvent
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

    comm.on('sync:state', handler)
    comm.onMessage(message({ source: { postMessage: vi.fn() } as unknown as Window }))
    comm.onMessage(message({ source: null }))

    expect(handler).not.toHaveBeenCalled()
  })

  it('ignores messages from an origin other than the first one', () => {
    const comm = new SpecBridgeCommunicator()
    const handler = vi.fn()

    comm.on('sync:state', handler)
    comm.onMessage(message())
    comm.onMessage(message({ origin: 'http://other.example.com:3500' }))

    expect(handler).toHaveBeenCalledOnce()
  })
})
