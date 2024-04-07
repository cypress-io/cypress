import Debug from 'debug'
import { Transform, Readable } from 'stream'

const debug = Debug('cypress:server:cloud:stream-activity-monitor')
const debugVerbose = Debug('cypress-verbose:server:cloud:stream-activity-monitor')

export class StreamStartTimedOutError extends Error {
  constructor (maxStartDwellTime: number) {
    super(`Source stream failed to begin sending data after ${maxStartDwellTime}ms`)
  }
}

export class StreamStalledError extends Error {
  constructor (maxActivityDwellTime: number) {
    super(`Stream stalled: no activity detected in the previous ${maxActivityDwellTime}ms`)
  }
}

/**
 * `StreamActivityMonitor` encapsulates state with regard to monitoring a stream
 * for flow failure states. Given a maxStartDwellTime and a maxActivityDwellTime, this class
 * can `monitor` a Node Readable stream and signal if the sink (e.g., a `fetch`) should be
 * aborted via an AbortController that can be retried via `getController`. It does this
 * by creating an identity Transform stream and piping the source stream through it. The
 * transform stream receives each chunk that the source emits, and orchestrates some timeouts
 * to determine if the stream has failed to start, or if the data flow has stalled.
 *
 * Example usage:
 *
 * const MAX_START_DWELL_TIME = 5000
 * const MAX_ACTIVITY_DWELL_TIME = 5000
 * const stallDetection = new StreamActivityMonitor(MAX_START_DWELL_TIME, MAX_ACTIVITY_DWELL_TIME)
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
export class StreamActivityMonitor {
  private streamMonitor: Transform | undefined
  private startTimeout: NodeJS.Timeout | undefined
  private activityTimeout: NodeJS.Timeout | undefined
  private controller: AbortController

  constructor (private maxStartDwellTime: number, private maxActivityDwellTime: number) {
    this.controller = new AbortController()
  }

  public getController () {
    return this.controller
  }

  public monitor (stream: Readable): Readable {
    debug('monitoring stream')
    if (this.streamMonitor || this.startTimeout || this.activityTimeout) {
      this.reset()
    }

    this.streamMonitor = new Transform({
      transform: (chunk, _, callback) => {
        debugVerbose('Received chunk from File ReadableStream; Enqueing to network: ', chunk.length)

        clearTimeout(this.startTimeout)
        this.markActivityInterval()
        callback(null, chunk)
      },
    })

    this.startTimeout = setTimeout(() => {
      this.controller?.abort(new StreamStartTimedOutError(this.maxStartDwellTime))
    }, this.maxStartDwellTime)

    return stream.pipe(this.streamMonitor)
  }

  private reset () {
    debug('Resetting Stream Activity Monitor')
    clearTimeout(this.startTimeout)
    clearTimeout(this.activityTimeout)

    this.streamMonitor = undefined
    this.startTimeout = undefined
    this.activityTimeout = undefined

    this.controller = new AbortController()
  }

  private markActivityInterval () {
    debug('marking activity interval')
    clearTimeout(this.activityTimeout)
    this.activityTimeout = setTimeout(() => {
      this.controller?.abort(new StreamStalledError(this.maxActivityDwellTime))
    }, this.maxActivityDwellTime)
  }
}
