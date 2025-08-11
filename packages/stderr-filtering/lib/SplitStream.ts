import type { Writable } from 'stream'

/**
 * Handles backpressure-aware routing of content to two different writable streams.
 *
 * This class provides a clean interface for splitting content between two output streams.
 * It automatically handles backpressure by pausing when either stream cannot accept
 * more data and resuming when the stream becomes available again.
 *
 * @template T The type of content being routed
 */
export class SplitStream<T extends unknown> {
  private isPaused: boolean = false
  private pendingResolve?: () => void
  private pendingReject?: (err: Error) => void

  /**
   * Creates a new SplitStream instance.
   *
   * @param left The first writable stream
   * @param right The second writable stream
   */
  constructor (
    private left: Writable,
    private right: Writable,
  ) {}

  /**
   * Writes content to the left stream with backpressure handling.
   *
   * @param chunk The content to write to the left stream
   * @returns Promise that resolves when the write operation completes
   */
  async writeLeft (chunk: T): Promise<void> {
    return this.write(chunk, true)
  }

  /**
   * Writes content to the right stream with backpressure handling.
   *
   * @param chunk The content to write to the right stream
   * @returns Promise that resolves when the write operation completes
   */
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

  /**
   * Checks if the stream is currently paused due to backpressure.
   *
   * @returns True if the stream is paused, false otherwise
   */
  isCurrentlyPaused (): boolean {
    return this.isPaused
  }

  /**
   * Manually resumes processing if the stream is paused.
   *
   * This method can be used to force resumption of processing when the stream
   * is in a paused state due to backpressure.
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
