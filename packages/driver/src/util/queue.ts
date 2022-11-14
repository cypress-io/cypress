import Bluebird from 'bluebird'

interface QueueRunProps {
  onRun: () => Bluebird<any> | Promise<any>
  onError: (err: Error) => void
  onFinish: () => Bluebird<any> | Promise<any>
}

export class Queue<T> {
  private queueables: T[] = []
  private _stopped = false
  index: number = 0

  constructor (queueables: T[] = []) {
    this.queueables = queueables
  }

  get (): T[] {
    return this.queueables
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

  slice (index: number) {
    return this.queueables.slice(index)
  }

  at (index: number): T {
    return this.queueables[index]
  }

  reset () {
    this._stopped = false
  }

  clear () {
    this.index = 0
    this.queueables.length = 0
  }

  stop () {
    this._stopped = true
  }

  run ({ onRun, onError, onFinish }: QueueRunProps) {
    let inner
    let rejectOuterAndCancelInner

    // this ends up being the parent promise wrapper
    const promise = new Bluebird((resolve, reject) => {
      // bubble out the inner promise. we must use a resolve(null) here
      // so the outer promise is first defined else this will kick off
      // the 'next' call too soon and end up running commands prior to
      // the promise being defined
      inner = Bluebird
      .resolve(null)
      .then(onRun)
      .then(resolve)
      .catch(reject)

      // can't use onCancel argument here because it's called asynchronously.
      // when we manually reject our outer promise we have to immediately
      // cancel the inner one else it won't be notified and its callbacks
      // will continue to be invoked. normally we don't have to do this
      // because rejections come from the inner promise and bubble out to
      // our outer, but when we manually reject the outer promise, we
      // have to go in the opposite direction from outer -> inner
      rejectOuterAndCancelInner = (err) => {
        inner.cancel()
        reject(err)
      }
    })
    .catch(onError)
    .then(onFinish)

    const cancel = () => {
      promise.cancel()
      inner.cancel()
    }

    return {
      promise,
      cancel,
      // wrapped to ensure `rejectOuterAndCancelInner` is assigned
      // before reject is called
      reject: (err) => rejectOuterAndCancelInner(err),
    }
  }

  get length () {
    return this.queueables.length
  }

  get stopped () {
    return this._stopped
  }

  /**
   * Helper function to return the last item in the queue.
   * @returns The last item or undefined if the queue is empty.
   */
  last (): T | undefined {
    if (this.length < 1) {
      return undefined
    }

    return this.at(this.length - 1)
  }
}
