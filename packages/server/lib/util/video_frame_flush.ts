// After a spec finishes, the browser can still be painting (and delivering)
// the final video frames - ending the capture immediately would chop off the
// end of the video. Rather than always waiting a fixed amount of time, we
// watch for frame writes and consider the video flushed once no new frame has
// arrived within a quiet period, bounded by a maximum wait.
// @see https://github.com/cypress-io/cypress/issues/2370

// how long we must go without receiving a new video frame
// before considering the browser's frames flushed
const QUIET_PERIOD_MS = 250

// the maximum time to wait for frames to stop arriving - matches the fixed
// delay previously used to pad the end of the video
const MAX_WAIT_MS = 1000

export type FrameFlushDetector = {
  /**
   * Marks that a video frame was just received from the browser, extending
   * any pending `waitForFrameFlush` quiet period.
   */
  markFrameWritten: () => void
  /**
   * Resolves once no new frame has been marked within the quiet period,
   * or after the maximum wait, whichever comes first.
   */
  waitForFrameFlush: () => Promise<void>
}

export function createFrameFlushDetector ({ quietPeriodMs = QUIET_PERIOD_MS, maxWaitMs = MAX_WAIT_MS }: { quietPeriodMs?: number, maxWaitMs?: number } = {}): FrameFlushDetector {
  const activeWaiters = new Set<() => void>()

  const markFrameWritten = () => {
    activeWaiters.forEach((restartQuietPeriod) => restartQuietPeriod())
  }

  const waitForFrameFlush = () => {
    return new Promise<void>((resolve) => {
      let quietTimer: NodeJS.Timeout

      const finish = () => {
        clearTimeout(quietTimer)
        clearTimeout(maxTimer)
        activeWaiters.delete(restartQuietPeriod)
        resolve()
      }

      const restartQuietPeriod = () => {
        clearTimeout(quietTimer)
        quietTimer = setTimeout(finish, quietPeriodMs)
      }

      const maxTimer = setTimeout(finish, maxWaitMs)

      activeWaiters.add(restartQuietPeriod)
      restartQuietPeriod()
    })
  }

  return { markFrameWritten, waitForFrameFlush }
}
