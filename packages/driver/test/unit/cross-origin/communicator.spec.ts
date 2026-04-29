/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect } from 'vitest'
import { PrimaryOriginCommunicator } from '../../../src/cross-origin/communicator'

describe('PrimaryOriginCommunicator', () => {
  const fakeBridgeWindow = () => {
    const postMessage = vi.fn()

    return {
      postMessage,
      asWindow: { postMessage } as unknown as Window,
    }
  }

  it('removeCrossOriginDriverWindow stops toAllSpecBridges from messaging that origin', () => {
    const comm = new PrimaryOriginCommunicator()
    const { postMessage, asWindow } = fakeBridgeWindow()

    comm.onMessage({
      data: { event: 'cross:origin:bridge:ready', origin: 'https://secondary.example' },
      source: asWindow,
    })

    comm.toAllSpecBridges('sync:state', { duringUserTestExecution: false })
    expect(postMessage).toHaveBeenCalledOnce()

    comm.removeCrossOriginDriverWindow('https://secondary.example')
    postMessage.mockClear()

    comm.toAllSpecBridges('sync:state', { duringUserTestExecution: false })
    expect(postMessage).not.toHaveBeenCalled()
  })

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

    postMessage.mockClear()

    comm.toAllSpecBridges('sync:state', { duringUserTestExecution: false })
    expect(postMessage).not.toHaveBeenCalled()
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
