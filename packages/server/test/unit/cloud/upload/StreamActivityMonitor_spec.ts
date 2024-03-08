import sinon from 'sinon'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { StreamActivityMonitor, StreamStalled, StreamStartFailed } from '../../../../lib/cloud/upload/StreamActivityMonitor'

chai.use(chaiAsPromised)

describe('StreamTimeoutController', () => {
  const maxStartDwellTime = 1000
  const maxActivityDwellTime = 500

  let monitor: StreamActivityMonitor
  let clock: sinon.SinonFakeTimers
  let fakeStream: ReadableStream<string>
  let streamSink: WritableStream<string>
  let streamController: ReadableStreamDefaultController<string>

  let writtenValues: string

  beforeEach(() => {
    writtenValues = ''
    monitor = new StreamActivityMonitor(maxStartDwellTime, maxActivityDwellTime)
    clock = sinon.useFakeTimers()

    fakeStream = new ReadableStream<string>({
      start (controller) {
        streamController = controller
      },
    })

    streamSink = new WritableStream({
      write (chunk) {
        writtenValues += chunk

        return Promise.resolve()
      },
    })
  })

  afterEach(() => {
    clock.restore()
  })

  describe('when monitoring a stream', () => {
    beforeEach(() => {
      monitor.monitor(fakeStream).pipeTo(streamSink)
    })

    it('signals an abort if no initial activity happens within maxStartDwellTime', async () => {
      await clock.tickAsync(maxStartDwellTime + 1)
      expect(monitor.getController().signal.aborted).to.be.true
      expect(monitor.getController().signal.reason).to.be.an.instanceOf(StreamStartFailed)
    })

    it('signals an abort if activity fails to happen after maxActivityDwellTime', async () => {
      streamController.enqueue('some data')
      await clock.tickAsync(maxActivityDwellTime + 1)
      expect(monitor.getController().signal.aborted).to.be.true
      expect(monitor.getController().signal.reason).to.be.an.instanceOf(StreamStalled)
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
      expect(monitor.getController().signal.aborted).not.to.be.true
      expect(monitor.getController().signal.reason).to.be.undefined
    })

    it('passes data through', async () => {
      const value = 'some data'

      streamController.enqueue(value)
      streamController.enqueue(value)
      await clock.nextAsync()
      expect(writtenValues).to.equal(value + value)
    })
  })
})
