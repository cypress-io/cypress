export class StreamStartFailed extends Error {
  constructor (maxStartDwellTime: number) {
    super(`Source stream failed to begin sending data after ${maxStartDwellTime}ms`)
  }
}

export class StreamStalled extends Error {
  constructor (maxActivityDwellTime: number) {
    super(`Stream stalled: no activity detected in the previous ${maxActivityDwellTime}ms`)
  }
}

export class StreamActivityMonitor {
  private activityMonitor: TransformStream | undefined
  private startTimeout: NodeJS.Timeout | undefined
  private activityTimeout: NodeJS.Timeout | undefined
  private controller: AbortController

  constructor (private maxStartDwellTime: number, private maxActivityDwellTime: number) {
    this.controller = new AbortController()
  }

  public getController () {
    return this.controller
  }

  private markActivityInterval () {
    clearTimeout(this.activityTimeout)
    this.activityTimeout = setTimeout(() => {
      this.controller?.abort(new StreamStalled(this.maxActivityDwellTime))
    }, this.maxActivityDwellTime)
  }

  public monitor<T> (stream: ReadableStream<T>): ReadableStream<T> {
    if (this.activityMonitor) {
      throw new Error('Cannot re-use a StreamTimeoutController: create a new one.')
    }

    this.activityMonitor = new TransformStream<T, T>({
      transform: (chunk, controller) => {
        controller.enqueue(chunk)
        clearTimeout(this.startTimeout)
        this.markActivityInterval()
      },
    })

    this.startTimeout = setTimeout(() => {
      this.controller?.abort(new StreamStartFailed(this.maxStartDwellTime))
    }, this.maxStartDwellTime)

    return stream.pipeThrough<T>(this.activityMonitor)
  }
}
