import Bluebird from 'bluebird'

interface QueueRunProps {
  onRun: () => Bluebird<any> | Promise<any>
  onError: (err: Error) => void
  onFinish: () => void
}

export default {
  create: <T>(queueables: T[] = []) => {
    let stopped = false

    const get = (): T[] => {
      return queueables
    }

    const add = (queueable: T) => {
      queueables.push(queueable)
    }

    const insert = (index: number, queueable: T) => {
      if (index < 0 || index > queueables.length) {
        throw new Error(`queue.insert must be called with a valid index - the index (${index}) is out of bounds`)
      }

      queueables.splice(index, 0, queueable)

      return queueable
    }

    const slice = (index: number) => {
      return queueables.slice(index)
    }

    const at = (index: number): T => {
      return get()[index]
    }

    const reset = () => {
      stopped = false
    }

    const clear = () => {
      queueables.length = 0
    }

    const stop = () => {
      stopped = true
    }

    const run = ({ onRun, onError, onFinish }: QueueRunProps) => {
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
      .finally(onFinish)

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

    return {
      get,
      add,
      insert,
      slice,
      at,
      reset,
      clear,
      stop,
      run,

      get length () {
        return queueables.length
      },

      get stopped () {
        return stopped
      },
    }
  },
}
