import Debug from 'debug'
import { Transform, Readable } from 'stream'
import { StreamStalledError } from './stream_stalled_error'
const debug = Debug('cypress:server:cloud:stream-activity-monitor')
const debugVerbose = Debug('cypress-verbose:server:cloud:stream-activity-monitor')

/**
 * `StreamActivityMonitor` encapsulates state with regard to monitoring a stream for flow
 * failure states. Given a maxActivityDwellTime, this class can `monitor` a Node Readable
 * stream and signal if the sink (e.g., a `fetch`) should be aborted via an AbortController
 * that can be retried via `getController`. It does this by creating an identity Transform
 * stream and piping the source stream through it. The transform stream receives each chunk
 * that the source emits, and orchestrates some timeouts to determine if the stream has stalled.
 *
 * Example usage:
 *
 * const MAX_ACTIVITY_DWELL_TIME = 5000
 * const stallDetection = new StreamActivityMonitor(MAX_ACTIVITY_DWELL_TIME)
 * try {
 *   const source = fs.createReadStream('/some/source/file')
 *   await fetch('/destination/url', {
 *     method: 'PUT',
 *     body: stallDetection.monitor(source)
 *     signal: stallDetection.getController().signal
 *   })
 * } catch (e) {
 *   if (stallDetection.getController().signal.reason) {
 *     // the `fetch` was aborted by the signal that `stallDetection` controlled
 *   }
 * }
 *
 */

const DEFAULT_FS_READSTREAM_CHUNK_SIZE_BYTES = 64 * 1024 // 64 kB

export class StreamActivityMonitor {
  private streamMonitor: Transform | undefined
  private activityTimeout: NodeJS.Timeout | undefined
  private controller: AbortController

  constructor (private maxActivityDwellTime: number) {
    this.controller = new AbortController()
  }

  public getController () {
    return this.controller
  }

  public monitor (stream: Readable): Readable {
    debug('monitoring stream')
    if (this.streamMonitor || this.activityTimeout) {
      this.reset()
    }

    this.streamMonitor = new Transform({
      transform: (chunk, _, callback) => {
        debugVerbose('Received chunk from File ReadableStream; Enqueing to network: ', chunk.length)

        this.markActivityInterval()
        callback(null, chunk)
      },
    })

    return stream.pipe(this.streamMonitor)
  }

  private reset () {
    debug('Resetting Stream Activity Monitor')
    clearTimeout(this.activityTimeout)

    this.streamMonitor = undefined
    this.activityTimeout = undefined

    this.controller = new AbortController()
  }

  private markActivityInterval () {
    debug('marking activity interval')
    clearTimeout(this.activityTimeout)
    this.activityTimeout = setTimeout(() => {
      this.controller?.abort(new StreamStalledError(this.maxActivityDwellTime, DEFAULT_FS_READSTREAM_CHUNK_SIZE_BYTES))
    }, this.maxActivityDwellTime)
  }
}
