import { Readable, Writable } from 'stream'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { StreamActivityMonitor } from '../../../../lib/cloud/upload/stream_activity_monitor'
import { StreamStalledError } from '../../../../lib/cloud/upload/stream_stalled_error'

describe('StreamTimeoutController', () => {
  const maxStartDwellTime = 1000
  const maxActivityDwellTime = 500

  let monitor: StreamActivityMonitor
  let fakeWebReadableStream: ReadableStream<string>
  let fakeNodeReadableStream: Readable
  let streamSink: Writable
  let streamController: ReadableStreamDefaultController<string>

  let writtenValues: string

  beforeEach(() => {
    writtenValues = ''
    monitor = new StreamActivityMonitor(maxActivityDwellTime)
    vi.useFakeTimers()

    fakeWebReadableStream = new ReadableStream<string>({
      start (controller) {
        streamController = controller
      },
    })

    // @ts-expect-error Node 18+ stream compatibility
    fakeNodeReadableStream = Readable.fromWeb(fakeWebReadableStream)

    streamSink = new Writable()
    streamSink._write = (chunk, _, callback) => {
      writtenValues += chunk
      callback()
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('when monitoring a stream', () => {
    beforeEach(() => {
      monitor.monitor(fakeNodeReadableStream).pipe(streamSink)
    })

    /**
     * This logic was changed: previously, the activity monitor would abort if a connection could
     * not be established within 5 seconds. This was pre-empting certain system errors from reporting
     * properly, resulting in confusing stream stall / abort messaging. The default timeout for DNS
     * queries in Windows, for example, is 15 seconds.
     */
    it('does not signal an abort if no initial activity happens within maxStartDwellTime', async () => {
      await vi.advanceTimersByTimeAsync(maxStartDwellTime + 1)
      expect(monitor.getController().signal.aborted).toBe(false)
      expect(monitor.getController().signal.reason).toBeUndefined()
    })

    it('signals an abort if activity fails to happen after maxActivityDwellTime', async () => {
      streamController.enqueue('some data')
      await vi.advanceTimersByTimeAsync(maxActivityDwellTime + 1)
      expect(monitor.getController().signal.aborted).toBe(true)
      expect(monitor.getController().signal.reason).toBeInstanceOf(StreamStalledError)
    })

    it('does not signal an abort if initial activity happens within maxStartDwellTime', async () => {
      await vi.advanceTimersByTimeAsync(maxStartDwellTime - 10)
      streamController.enqueue('some data')
      expect(monitor.getController().signal.aborted).not.toBe(true)
      expect(monitor.getController().signal.reason).toBeUndefined()
    })

    it('does not signal an abort if subsequent activity happens within maxActivityDwellTime', async () => {
      streamController.enqueue('some data')
      await vi.advanceTimersByTimeAsync(maxActivityDwellTime - 10)
      streamController.enqueue('some more data')
      await vi.advanceTimersByTimeAsync(maxActivityDwellTime - 10)
      expect(monitor.getController().signal.aborted).not.toBe(true)
      expect(monitor.getController().signal.reason).toBeUndefined()
    })

    it('passes data through', async () => {
      const value = 'some data'

      streamController.enqueue(value)
      streamController.enqueue(value)
      await vi.advanceTimersByTimeAsync(maxActivityDwellTime)
      expect(writtenValues).toBe(value + value)
    })
  })
})
