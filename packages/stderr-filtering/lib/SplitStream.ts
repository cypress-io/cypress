import type { Writable } from 'stream'

export class SplitStream<T extends unknown> {
  private isPaused: boolean = false
  private pendingResolve?: () => void
  private pendingReject?: (err: Error) => void

  constructor (
    private left: Writable,
    private right: Writable,
  ) {}

  async writeLeft (chunk: T): Promise<void> {
    return this.write(chunk, true)
  }

  async writeRight (chunk: T): Promise<void> {
    return this.write(chunk, false)
  }

  private async write (chunk: T, isLeft: boolean): Promise<void> {
    const stream = isLeft ? this.left : this.right

    try {
      const canWriteMore = stream.write(chunk)

      if (!canWriteMore) {
        this.isPaused = true

        return new Promise<void>((resolve, reject) => {
          this.pendingResolve = resolve
          this.pendingReject = reject

          stream.once('drain', () => {
            this.isPaused = false
            if (this.pendingResolve) {
              this.pendingResolve()
              this.pendingResolve = undefined
              this.pendingReject = undefined
            }
          })
        })
      }
    } catch (err) {
      throw err as Error
    }
  }
  /*
   * Check if the handler is currently paused due to backpressure
   */
  isCurrentlyPaused (): boolean {
    return this.isPaused
  }

  /**
   * Resume processing if paused
   */
  resume (): void {
    if (this.isPaused && this.pendingResolve) {
      this.isPaused = false
      this.pendingResolve()
      this.pendingResolve = undefined
      this.pendingReject = undefined
    }
  }
}
