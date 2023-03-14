import { EventEmitter2 } from 'eventemitter2'

type QueueState = 'ready' | 'running' | 'stopping' | 'stopped'

/* Diagram created with https://asciiflow.com/
 *
 *                  Command Queue              stop()
 *                                               │
 *                                     state == 'stopped|ready'?────┐
 *       emit('complete')                        |                  │
 *        ┌────────────┐                       true               false
 *        │            │                         │                  │
 *        │ remainingItems() == 0                ▼                  ▼
 * ┌──────▼──────┐     ▲                   emit('stopped')    state.stopping
 * │┼───────────┼│     │                    state.stopped
 * ││state.ready│┼─►.run()◄──────true──┐
 * │┼───────────┼│     │               │
 * └─────────────┘     ▼           state == 'running'?──┐
 *             remainingItems() > 0    ▲                │
 *        ┌──────┐     │               │                │
 *        ▼      │     ▼               │              false
 *    .run()────►state.running         │                │
 *                     │        emit('itemComplete')    │
 *                     │               │                │
 *                     └───runItem()───┘                │
 *                             │                emit('stopped')
 *                   emit('itemError')                  │
 *                ┌──────┐     │                        │
 *                ▼      │     ▼                        │
 *            .run()────►state.stopped◄─────────────────┘
 */

export class Queue<T> extends EventEmitter2 {
  protected queueables: Queuables[] = []
  protected state: QueueState = 'ready'
  steppingThrough = false
  index: number = 0

  get length () {
    return this.queueables.length
  }

  get current (): T {
    return this.queueables[this.index]
  }

  add (queueable: T) {
    this.queueables.push(queueable)
  }

  insert (index: number, queueable: T) {
    if (index < 0 || index > this.queueables.length) {
      throw new Error(`queue.insert must be called with a valid index - the index (${index}) is out of bounds`)
    }

    this.queueables.splice(index, 0, queueable)

    return queueable
  }

  at (index: number) {
    return this.queueables[index]
  }

  async stop () {
    // If we're running or already stopping, we set the state to 'stopping'
    // and wait for the current item to finish.
    // It will emit 'stopped' and this function can resolve.
    if (this.state === 'running' || this.state === 'stopping') {
      this.state = 'stopping'
      return this.waitFor('stopped')
    }

    // If we're not running, we can just 'stop' immediately, since
    // there's nothing async going on here.
    this.state = 'stopped'
    this.emit('stopped')
  }

  runItem(item: T) {
    throw new Error('Default implementation; override this.')
  }

  async run () {
    if (this.state === 'running' || this.state === 'stopped') {
      return
    }

    let next = this.queueables[this.index]

    if (!next) {
      this.emit('complete')
      return
    }

    try {
      this.state = 'running'
      await this.runItem(next)
      this.emit('itemComplete')
    } catch (e) {
      this.state = 'stopping'
      this.emit('itemError', e)
    }

    if (this.state === 'stopping') {
      this.emit('stopped')
      return
    }

    // If we haven't stopped or errored while waiting for the current queueable
    // then kick off the next queueable.
    this.state = 'ready'
    this.index++
    this.run()
  }
}
