const { sinon, expect } = require('../../../spec_helper')

import { StreamActivityMonitor } from '../../../../lib/cloud/upload/stream_activity_monitor'
import { StreamStalledError } from '../../../../lib/cloud/upload/stream_stalled_error'
import { Readable, Writable } from 'stream'

describe('StreamTimeoutController', () => {
  const maxStartDwellTime = 1000
  const maxActivityDwellTime = 500

  let monitor: StreamActivityMonitor
  let clock: sinon.SinonFakeTimers
  let fakeWebReadableStream: ReadableStream<string>
  let fakeNodeReadableStream: Readable
  let streamSink: Writable
  let streamController: ReadableStreamDefaultController<string>

  let writtenValues: string

  beforeEach(() => {
    writtenValues = ''
    monitor = new StreamActivityMonitor(maxActivityDwellTime)
    clock = sinon.useFakeTimers()

    // oddly, it's easier to asynchronously emit data from a ReadableStream than
    // it is to asynchronously emit data from a Readable, so to test this we are
    // converting a ReadableStream to a Writable
    fakeWebReadableStream = new ReadableStream<string>({
      start (controller) {
        streamController = controller
      },
    })

    // @ts-ignore
    fakeNodeReadableStream = Readable.fromWeb(fakeWebReadableStream)

    streamSink = new Writable()
    streamSink._write = (chunk, _, callback) => {
      writtenValues += chunk
      callback()
    }
  })

  afterEach(() => {
    clock.restore()
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
      await clock.tickAsync(maxStartDwellTime + 1)
      expect(monitor.getController().signal.aborted).to.be.false
      expect(monitor.getController().signal.reason).to.be.undefined
    })

    it('signals an abort if activity fails to happen after maxActivityDwellTime', async () => {
      streamController.enqueue('some data')
      await clock.tickAsync(maxActivityDwellTime + 1)
      expect(monitor.getController().signal.aborted).to.be.true
      expect(monitor.getController().signal.reason).to.be.an.instanceOf(StreamStalledError)
    })

    it('does not signal an abort if initial activity happens within maxStartDwellTime', async () => {
      await clock.tickAsync(maxStartDwellTime - 10)
      streamController.enqueue('some data')
      expect(monitor.getController().signal.aborted).not.to.be.true
      expect(monitor.getController().signal.reason).to.be.undefined
    })

    it('does not signal an abort if subsequent activity happens within maxActivityDwellTime', async () => {
      streamController.enqueue('some data')
      await clock.tickAsync(maxActivityDwellTime - 10)
      streamController.enqueue('some more data')
      await clock.tickAsync(maxActivityDwellTime - 10)
      expect(monitor.getController().signal.aborted).not.to.be.true
      expect(monitor.getController().signal.reason).to.be.undefined
    })

    it('passes data through', async () => {
      const value = 'some data'

      streamController.enqueue(value)
      streamController.enqueue(value)
      await clock.tickAsync(maxActivityDwellTime)
      expect(writtenValues).to.equal(value + value)
    })
  })
})
