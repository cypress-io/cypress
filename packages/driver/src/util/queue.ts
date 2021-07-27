import Bluebird from 'bluebird'

export interface Queueable {
  run: () => Bluebird<any> | Promise<any> | void
  data: any
}

export const create = (queueables: Queueable[] = []) => {
  let stopped = false

  const get = () => {
    return queueables.map((q) => q.data)
  }

  const add = (queueable: Queueable) => {
    queueables.push(queueable)
  }

  const insert = (index: number, queueable: Queueable) => {
    if (index < 0 || index > queueables.length) {
      throw new Error(`queue.insert must be called with a valid index - the index (${index}) is out of bounds`)
    }

    queueables.splice(index, 0, queueable)

    return queueable.data
  }

  const slice = (index: number) => {
    return queueables.slice(index).map((q) => q.data)
  }

  const at = (index: number) => {
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

  const run = () => {
    const next = () => {
      // bail if we've been told to abort in case
      // an old command continues to run after
      if (stopped) {
        return
      }
    }

    next()
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
}
