import type { MockedObject } from 'vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { writeWithBackpressure } from '../writeWithBackpressure'
import type { Writable } from 'stream'

describe('writeWithBackpressure', () => {
  let output: MockedObject<Writable>

  beforeEach(() => {
    vi.clearAllMocks()

    output = {
      // @ts-expect-error - mock impl does not match impl
      write: vi.fn<Writable['write']>(),
      // @ts-expect-error - mock impl does not match impl
      once: vi.fn<Writable['once']>().mockImplementation((event, listener) => {
        if (event === 'drain') {
          listener()
        }

        return output
      }),
    }
  })

  describe('when the stream is ready to write', () => {
    beforeEach(() => {
      output.write.mockReturnValue(true)
    })

    it('writes a chunk to a writable stream', async () => {
      await writeWithBackpressure(output, 'test')
      expect(output.write).toHaveBeenCalledWith(Buffer.from('test'))
    })
  })

  describe('when the stream is not ready to write', () => {
    beforeEach(() => {
      output.write.mockReturnValue(false)
    })

    it('resolves once drain is emitted', async () => {
      let emitDrain: (() => void) | undefined

      // @ts-expect-error - mock impl does not match impl
      output.once.mockImplementation((event, listener) => {
        if (event === 'drain') {
          emitDrain = listener
        }

        return output
      })

      let resolved = false
      const writePromise = writeWithBackpressure(output, 'test').then(() => {
        resolved = true
      })

      expect(output.write).toHaveBeenCalledWith(Buffer.from('test'))
      expect(output.once).toHaveBeenCalledWith('drain', expect.any(Function))

      // A macrotask runs after every pending microtask, so a promise that
      // didn't wait for drain has settled by now
      await new Promise((resolve) => setImmediate(resolve))
      expect(resolved).toBe(false)

      emitDrain?.()
      await writePromise
      expect(resolved).toBe(true)
    })
  })
})
