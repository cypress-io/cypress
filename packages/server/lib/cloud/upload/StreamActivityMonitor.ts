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

export class StreamActivityMonitor {
  private streamMonitor: TransformStream | undefined
  private startTimeout: NodeJS.Timeout | undefined
  private activityTimeout: NodeJS.Timeout | undefined
  private controller: AbortController

  constructor (private maxStartDwellTime: number, private maxActivityDwellTime: number) {
    this.controller = new AbortController()
  }

  public getController () {
    return this.controller
  }

  public monitor<T> (stream: ReadableStream<T>): ReadableStream<T> {
    if (this.streamMonitor || this.startTimeout || this.activityTimeout) {
      this.reset()
    }

    this.streamMonitor = new TransformStream<T, T>({
      transform: (chunk, controller) => {
        controller.enqueue(chunk)
        clearTimeout(this.startTimeout)
        this.markActivityInterval()
      },
    })

    this.startTimeout = setTimeout(() => {
      this.controller?.abort(new StreamStartTimedOutError(this.maxStartDwellTime))
    }, this.maxStartDwellTime)

    return stream.pipeThrough<T>(this.streamMonitor)
  }

  private reset () {
    clearTimeout(this.startTimeout)
    clearTimeout(this.activityTimeout)

    this.streamMonitor = undefined
    this.startTimeout = undefined
    this.activityTimeout = undefined

    this.controller = new AbortController()
  }

  private markActivityInterval () {
    clearTimeout(this.activityTimeout)
    this.activityTimeout = setTimeout(() => {
      this.controller?.abort(new StreamStalledError(this.maxActivityDwellTime))
    }, this.maxActivityDwellTime)
  }
}
