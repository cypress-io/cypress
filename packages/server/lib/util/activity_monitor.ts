import Debug from 'debug'

const debug = Debug('cypress:server:activity-monitor')

interface ActivityMonitorOptions {
  // how long the run may go without any driver->server activity before we
  // suspect a hang and ask `onInactivity` to confirm it
  timeout: number
  // Called once the run has been silent for `timeout` ms. Resolving `true`
  // means the run is confirmed hung and monitoring stays stopped; resolving
  // `false` means the run is really still alive (e.g. an unresponsive-looking
  // but healthy renderer mid-`cy.wait`) and monitoring resumes. `signal` is
  // aborted if `stop()` is called while this is still running, meaning the
  // spec already ended and the result must not be acted on.
  onInactivity: (signal: AbortSignal) => Promise<boolean>
}

// Tracks whether a run is making progress by watching the stream of
// driver->server messages. A genuine browser hang goes completely silent -
// no `mocha`, `backend:request`, or `automation:request` traffic - whereas a
// slow-but-healthy test keeps that traffic flowing. We time out on silence,
// not on duration, so a legitimately long test is never mistaken for a hang.
export class ActivityMonitor {
  private timeout: number
  private onInactivity: (signal: AbortSignal) => Promise<boolean>
  private timer: NodeJS.Timeout | undefined
  private abortController: AbortController | undefined
  private active = false
  private confirming = false

  constructor (options: ActivityMonitorOptions) {
    this.timeout = options.timeout
    this.onInactivity = options.onInactivity
  }

  start () {
    this.active = true
    this.arm()
  }

  stop () {
    this.active = false
    this.clear()
    this.abortController?.abort()
  }

  // Whether the monitor is currently watching for silence.
  get started () {
    return this.active
  }

  // Record that the run is still doing something, which pushes the silence
  // deadline out. Once the deadline has already fired we are waiting on the
  // liveness probe to decide whether the browser is hung; a late or buffered
  // message arriving during that wait must not cancel that decision by pushing
  // the deadline back out, so bumps are dropped until the probe resolves.
  bump () {
    if (!this.active || this.confirming) {
      return
    }

    this.arm()
  }

  private arm () {
    this.clear()
    this.timer = setTimeout(() => this.onDeadline(), this.timeout)
  }

  private clear () {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
  }

  private async onDeadline () {
    if (!this.active) {
      return
    }

    this.confirming = true
    debug('no activity for %dms, confirming whether the run is hung', this.timeout)

    let hung = true

    this.abortController = new AbortController()

    try {
      hung = await this.onInactivity(this.abortController.signal)
    } catch (err) {
      debug('inactivity handler threw, treating the run as hung: %o', err)
    }

    this.confirming = false
    this.abortController = undefined

    if (!this.active) {
      return
    }

    if (hung) {
      // the caller is tearing the spec down; leave the monitor stopped
      this.active = false

      return
    }

    // false alarm - the run answered, so resume watching for silence
    this.arm()
  }
}
