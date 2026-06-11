import Debug from 'debug'

const debug = Debug('cypress:server:artifact-queue')

/**
 * A task may resolve with a callback, which `drain` invokes in enqueue order
 * so console output can be deferred to the end of the run rather than
 * interleaving with the output of whichever spec is running when the task
 * completes.
 */
type DeferredOutput = (() => void) | void

type ArtifactTask = {
  name: string
  promise: Promise<DeferredOutput>
  settled: boolean
}

/**
 * Runs artifact post-processing (video compression and cloud artifact
 * uploads) in the background while subsequent specs execute, instead of
 * blocking the spec loop. The spec loop awaits `drain` once, at the end of
 * the run, before results are finalized.
 *
 * A task that rejects is logged and treated as complete - background
 * artifact work never fails the run.
 */
export class ArtifactQueue {
  private tasks: ArtifactTask[] = []
  // ffmpeg compression is CPU-bound, so compression tasks are chained to run
  // one at a time rather than all competing with the currently running spec
  private videoCompressionTail: Promise<DeferredOutput> = Promise.resolve()

  // true while any enqueued task has not finished running
  get hasPendingTasks (): boolean {
    return this.tasks.some((task) => !task.settled)
  }

  enqueue (name: string, fn: () => Promise<DeferredOutput>): Promise<DeferredOutput> {
    return this.track(name, fn())
  }

  enqueueVideoCompression (name: string, fn: () => Promise<DeferredOutput>): Promise<DeferredOutput> {
    const promise = this.videoCompressionTail.then(fn)

    this.videoCompressionTail = this.track(name, promise)

    return this.videoCompressionTail
  }

  private track (name: string, promise: Promise<DeferredOutput>): Promise<DeferredOutput> {
    debug('enqueued background artifact task: %s', name)

    // attach the catch eagerly so a task failing before drain() never
    // surfaces as an unhandled rejection
    const settled = promise.catch((err) => {
      debug('background artifact task %s failed: %o', name, err)
    })

    const task: ArtifactTask = { name, promise: settled, settled: false }

    settled.then(() => {
      task.settled = true
    })

    this.tasks.push(task)

    return settled
  }

  async drain (): Promise<void> {
    // tasks can enqueue follow-up tasks while draining, so loop until quiesced
    while (this.tasks.length) {
      const tasks = this.tasks

      this.tasks = []

      for (const { name, promise } of tasks) {
        const deferredOutput = await promise

        debug('background artifact task complete: %s', name)

        if (typeof deferredOutput === 'function') {
          deferredOutput()
        }
      }
    }

    this.videoCompressionTail = Promise.resolve()
  }
}

// a run-mode process executes a single run, so a module-level queue is shared
// between the spec loop (run.ts) and record mode (record.ts), mirroring how
// other run state is kept at module level in run.ts
export const artifactQueue = new ArtifactQueue()

// associates a spec's results object with its backgrounded video compression
// task, so record mode can wait for compression to finish replacing the
// recording before uploading it
const videoCompressionTasks = new WeakMap<object, Promise<unknown>>()

export const setVideoCompressionTask = (results: object, task: Promise<unknown>): void => {
  videoCompressionTasks.set(results, task)
}

export const getVideoCompressionTask = (results: object): Promise<unknown> | undefined => {
  return videoCompressionTasks.get(results)
}
