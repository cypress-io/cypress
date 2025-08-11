import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Writable } from 'stream'
import { SplitStream } from '../SplitStream'

describe('SplitStream', () => {
  let splitStream: SplitStream<string>
  let leftStream: Writable
  let rightStream: Writable

  beforeEach(() => {
    leftStream = new Writable({
      write: (chunk, encoding, callback) => {
        callback?.(null)
      },
    })

    rightStream = new Writable({
      write: (chunk, encoding, callback) => {
        callback?.(null)
      },
    })

    vi.spyOn(leftStream, 'write')
    vi.spyOn(rightStream, 'write')

    splitStream = new SplitStream(leftStream, rightStream)
  })

  function pauseStream (stream: Writable, setWritable: boolean = false): () => Promise<void> {
    vi.mocked(stream.write).mockClear()
    vi.mocked(stream.write).mockImplementation(() => false)

    const writableSpy = vi.spyOn(stream, 'writable', 'get')

    if (setWritable) {
      writableSpy.mockReturnValue(false)
    }

    const drainCallbackReady = new Promise<() => void>((resolve) => {
      vi.spyOn(stream, 'once').mockImplementation((event, callback) => {
        if (event === 'drain') {
          resolve(callback as () => void)
        }

        return stream
      })
    })

    return async function resumeStream () {
      vi.mocked(stream.write).mockClear()
      vi.mocked(stream.write).mockImplementation(() => true)
      if (setWritable) {
        writableSpy.mockReturnValue(true)
      }

      const drainCallback = await drainCallbackReady

      drainCallback()
    }
  }

  it('writes content to the left stream', async () => {
    const content = 'test content'

    await splitStream.writeLeft(content)

    expect(leftStream.write).toHaveBeenCalledWith(content)
    expect(rightStream.write).not.toHaveBeenCalled()
  })

  describe('when the left stream is paused', () => {
    it('waits for the left stream to drain when the left stream is paused', async () => {
      const resumeLeftStream = pauseStream(leftStream, true)

      const writePromise = splitStream.writeLeft('test content')

      await resumeLeftStream()

      await writePromise
    })
  })

  describe('when the left stream is full', () => {
    let resumeLeftStream: () => Promise<void>

    beforeEach(() => {
      resumeLeftStream = pauseStream(leftStream)
    })

    it('waits for the left stream to drain', async () => {
      const writePromise = splitStream.writeLeft('test content')

      await resumeLeftStream()

      await writePromise
    })

    it('propagates errors from the left stream', async () => {
      const error = new Error('test error')

      vi.mocked(leftStream.write).mockImplementationOnce(() => {
        throw error
      })

      await expect(splitStream.writeLeft('test content')).rejects.toThrow(error)
    })

    it('allows writeRight when left stream is paused', async () => {
      // Left stream is full
      const leftWritePromise = splitStream.writeLeft('left content')

      // Right stream should still work
      await splitStream.writeRight('right content')

      expect(rightStream.write).toHaveBeenCalledWith('right content')

      // Complete left write
      await resumeLeftStream()
      await leftWritePromise
    })

    it('waits for drain when the left stream is paused', async () => {
      // Left stream is full
      const leftWritePromise = splitStream.writeLeft('left content')

      await resumeLeftStream()

      await leftWritePromise
    })
  })

  it('writes content to the right stream', async () => {
    const content = 'test content'

    await splitStream.writeRight(content)

    expect(rightStream.write).toHaveBeenCalledWith(content)
    expect(leftStream.write).not.toHaveBeenCalled()
  })

  describe('when the right stream is paused', () => {
    it('waits for the right stream to drain when the right stream is paused', async () => {
      const resumeRightStream = pauseStream(rightStream, true)

      const writePromise = splitStream.writeRight('test content')

      await resumeRightStream()

      await writePromise
    })
  })

  describe('when the right stream is full', () => {
    it('waits for the right stream to drain', async () => {
      // stream returns false when it's full
      const resumeRightStream = pauseStream(rightStream)
      const writePromise = splitStream.writeRight('test content')

      await resumeRightStream()

      await writePromise
    })

    it('propagates errors from the right stream', async () => {
      const error = new Error('test error')

      vi.mocked(rightStream.write).mockImplementationOnce(() => {
        throw error
      })

      await expect(splitStream.writeRight('test content')).rejects.toThrow(error)
    })

    // TODO: This test fails because a paused right stream will block the left stream
    it('allows writeLeft when right stream is paused', async () => {
      const resumeRightStream = pauseStream(rightStream)

      // Right stream is full
      const rightWritePromise = splitStream.writeRight('right content')

      // Left stream should still work
      await splitStream.writeLeft('left content')

      expect(leftStream.write).toHaveBeenCalledWith('left content')

      // Complete right write
      await resumeRightStream()
      await rightWritePromise
    })
  })
})
