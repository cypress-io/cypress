/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { create } from '../../../src/cy/location'

// A minimal entangled MessageChannel/MessagePort stand-in. jsdom's MessageChannel
// delivery is unreliable under fake timers, so we control message delivery
// ourselves: posting to port2 synchronously invokes port1's onmessage handler.
class FakeMessageChannel {
  port1: { onmessage: ((event: { data: any }) => void) | null, close: ReturnType<typeof vi.fn> }
  port2: { postMessage: (data: any) => void }

  constructor () {
    this.port1 = { onmessage: null, close: vi.fn() }
    this.port2 = {
      postMessage: (data: any) => {
        this.port1.onmessage?.({ data })
      },
    }
  }
}

describe('src/cy/location', () => {
  let location: ReturnType<typeof create>

  beforeEach(() => {
    // @ts-expect-error - replacing the global for the duration of the test
    global.MessageChannel = FakeMessageChannel
    // state is unused when we pass the window explicitly
    location = create(vi.fn() as any)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('getCrossOriginRemoteLocation', () => {
    // simulates a cross-origin AUT window: reading `location` throws like a
    // real cross-origin SecurityError, forcing the postMessage round-trip.
    const createCrossOriginWindow = (postMessage: Window['postMessage']) => {
      return {
        location: {
          toString () {
            throw new Error('Blocked a frame with cross-origin access')
          },
        },
        postMessage,
      } as unknown as Window
    }

    it('resolves with the location echoed back by the cross-origin AUT', async () => {
      const autWindow = createCrossOriginWindow((_msg, _origin, transfer) => {
        const [port2] = transfer as MessagePort[]

        // @ts-expect-error - our fake port
        port2.postMessage('https://www.example.com/#foobar')
      })

      const result = await location.getCrossOriginRemoteLocation(autWindow)

      expect(result.href).toEqual('https://www.example.com/#foobar')
    })

    it('retries the request until the AUT replies', async () => {
      vi.useFakeTimers()

      let attempts = 0

      const autWindow = createCrossOriginWindow((_msg, _origin, transfer) => {
        attempts++

        // only reply on the third attempt
        if (attempts === 3) {
          const [port2] = transfer as MessagePort[]

          // @ts-expect-error - our fake port
          port2.postMessage('https://www.example.com/#foobar')
        }
      })

      const promise = location.getCrossOriginRemoteLocation(autWindow)

      // first attempt fires synchronously; advance for the 2nd and 3rd retries
      await vi.advanceTimersByTimeAsync(100)
      await vi.advanceTimersByTimeAsync(100)

      const result = await promise

      expect(attempts).toEqual(3)
      expect(result.href).toEqual('https://www.example.com/#foobar')
    })

    it('falls back to about:blank when the AUT never replies, rather than hanging', async () => {
      vi.useFakeTimers()

      // never replies - mimics a redirect chain that navigates away before the
      // injected location listener can respond.
      const autWindow = createCrossOriginWindow(() => {})

      const promise = location.getCrossOriginRemoteLocation(autWindow)

      await vi.advanceTimersByTimeAsync(2000)

      const result = await promise

      expect(result.href).toEqual('about:blank')
    })
  })
})
