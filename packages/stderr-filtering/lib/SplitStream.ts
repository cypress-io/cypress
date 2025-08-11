import type { Writable } from 'stream'
import Debug from 'debug'
const debug = Debug('cypress-verbose:stderr-filtering:SplitStream')

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

    debug('write', { isLeft, chunk })
    try {
      if (!stream.writable) {
        debug('stream is not writable, waiting for drain')

        return new Promise<void>((resolve) => {
          stream.once('drain', () => {
            debug('stream drained')
            resolve()
          })
        })
      }

      debug('writing chunk', { chunk })
      const canWriteMore = stream.write(chunk)

      if (!canWriteMore) {
        debug('stream is full, waiting for drain')

        return new Promise<void>((resolve) => {
          stream.once('drain', () => {
            debug('stream drained')
            resolve()
          })
        })
      }

      debug('wrote chunk', { chunk })
    } catch (err) {
      throw err as Error
    }
  }
}
