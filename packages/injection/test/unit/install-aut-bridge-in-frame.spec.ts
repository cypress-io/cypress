import { describe, it, expect, vi } from 'vitest'
import { installAutBridgeInFrame, BridgeWindow } from '../../lib/install-aut-bridge-in-frame'

const marker = 'Your project:'

interface FakeWindowOptions {
  name?: string
  isTop?: boolean
  frameElementId?: string
  frameElementThrows?: boolean
  origin?: string
  topOrigin?: string
  topThrows?: boolean
}

const fakeWindow = (opts: FakeWindowOptions = {}): BridgeWindow => {
  const win: any = {
    name: opts.name,
    location: { origin: opts.origin ?? 'https://app.example.com' },
  }

  if (opts.frameElementThrows) {
    Object.defineProperty(win, 'frameElement', {
      get () {
        throw new Error('cross-origin frameElement access')
      },
    })
  } else {
    win.frameElement = opts.frameElementId === undefined ? null : { id: opts.frameElementId }
  }

  if (opts.isTop) {
    win.top = win
  } else {
    const top: any = {}

    if (opts.topThrows) {
      Object.defineProperty(top, 'location', {
        get () {
          throw new Error('cross-origin top.location access')
        },
      })
    } else {
      top.location = { origin: opts.topOrigin ?? 'https://runner.example.com' }
    }

    win.top = top
  }

  return win
}

const mockHandlers = () => {
  return {
    onFull: vi.fn(),
    onCrossOrigin: vi.fn(),
    onPartial: vi.fn(),
  }
}

describe('installAutBridgeInFrame', () => {
  it('runs onFull for a same-origin AUT frame (identified by window.name)', () => {
    const handlers = mockHandlers()

    const level = installAutBridgeInFrame(
      fakeWindow({ name: `${marker} proj`, origin: 'https://app.example.com', topOrigin: 'https://app.example.com' }),
      marker,
      handlers,
    )

    expect(level).toEqual('full')
    expect(handlers.onFull).toHaveBeenCalledTimes(1)
    expect(handlers.onCrossOrigin).not.toHaveBeenCalled()
    expect(handlers.onPartial).not.toHaveBeenCalled()
  })

  it('treats the pre-navigation "null" origin as full', () => {
    const handlers = mockHandlers()

    const level = installAutBridgeInFrame(fakeWindow({ name: `${marker} proj`, origin: 'null' }), marker, handlers)

    expect(level).toEqual('full')
    expect(handlers.onFull).toHaveBeenCalledTimes(1)
  })

  it('runs onCrossOrigin for an AUT frame whose top.location throws (cross-origin)', () => {
    const handlers = mockHandlers()

    const level = installAutBridgeInFrame(
      fakeWindow({ name: `${marker} proj`, origin: 'https://app.example.com', topThrows: true }),
      marker,
      handlers,
    )

    expect(level).toEqual('cross-origin')
    expect(handlers.onCrossOrigin).toHaveBeenCalledTimes(1)
    expect(handlers.onFull).not.toHaveBeenCalled()
  })

  it('identifies the AUT frame via the frameElement.id fallback when window.name was overwritten', () => {
    const handlers = mockHandlers()

    const level = installAutBridgeInFrame(
      fakeWindow({ name: 'app-overwrote-this', frameElementId: `${marker} proj`, topOrigin: 'https://app.example.com' }),
      marker,
      handlers,
    )

    expect(level).toEqual('full')
    expect(handlers.onFull).toHaveBeenCalledTimes(1)
  })

  it('tolerates a cross-origin throw when reading frameElement', () => {
    const handlers = mockHandlers()

    // window.name still identifies the AUT frame, so a throwing frameElement must not break it
    const level = installAutBridgeInFrame(
      fakeWindow({ name: `${marker} proj`, frameElementThrows: true, topOrigin: 'https://app.example.com' }),
      marker,
      handlers,
    )

    expect(level).toEqual('full')
    expect(handlers.onFull).toHaveBeenCalledTimes(1)
  })

  it('runs onPartial for a non-AUT child frame', () => {
    const handlers = mockHandlers()

    const level = installAutBridgeInFrame(fakeWindow({ name: 'some-other-frame' }), marker, handlers)

    expect(level).toEqual('partial')
    expect(handlers.onPartial).toHaveBeenCalledTimes(1)
    expect(handlers.onFull).not.toHaveBeenCalled()
    expect(handlers.onCrossOrigin).not.toHaveBeenCalled()
  })

  it('runs no handler for the top (runner) frame', () => {
    const handlers = mockHandlers()

    const level = installAutBridgeInFrame(fakeWindow({ isTop: true }), marker, handlers)

    expect(level).toEqual('none')
    expect(handlers.onFull).not.toHaveBeenCalled()
    expect(handlers.onCrossOrigin).not.toHaveBeenCalled()
    expect(handlers.onPartial).not.toHaveBeenCalled()
  })
})
