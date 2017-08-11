// electron has completely busted timers resulting in
// all kinds of bizarre timeouts and unresponsive UI
// https://github.com/electron/electron/issues/7079
//
// this fixes this problem by replacing all the global
// timers and implementing a lightweight queuing mechanism
// involving a forked process

const cp = require('child_process')
const path = require('path')
const log = require('debug')('cypress:server:timers')

const st = global.setTimeout
const si = global.setInterval
const ct = global.clearTimeout
const ci = global.clearInterval

let child = null

function noop () {}

function restore () {
  // restore
  global.setTimeout = st
  global.setInterval = si
  global.clearTimeout = ct
  global.clearInterval = ci

  if (child) {
    child.kill()
  }

  child = null
}

function fix () {
  const queue = {}
  let idCounter = 0

  function sendAndQueue (id, cb, ms, args) {
    // const started = Date.now()
    log('queuing timer id %d after %d ms', id, ms)

    queue[id] = {
      // started,
      args,
      ms,
      cb,
    }

    child.send({
      id,
      ms,
    })

    // return the timer object
    return {
      id,
      ref: noop,
      unref: noop,
    }
  }

  function clear (id) {
    log('clearing timer id %d from queue %o', id, queue)

    delete queue[id]
  }

  // fork the child process
  let child = cp.fork(path.join(__dirname, 'child.js'), [], {
<<<<<<< HEAD
    stdio: 'inherit',
=======
>>>>>>> master
    env: {
      ELECTRON_RUN_AS_NODE: true,
    },
  })
  .on('message', (obj = {}) => {
    const { id } = obj

    const msg = queue[id]

    // if we didn't get a msg
    // that means we must have
    // cleared the timeout already
    if (!msg) {
      return
    }

    const { cb, args } = msg

    clear(id)

    cb(...args)
  })

  global.setTimeout = function (cb, ms, ...args) {
    idCounter += 1

    return sendAndQueue(idCounter, cb, ms, args)
  }

  global.clearTimeout = function (timer) {
    if (!timer) {
      return
    }

    // return undefined per the spec
    clear(timer.id)
  }

  global.clearInterval = function (timer) {
    if (!timer) {
      return
    }

    // return undefined per the spec
    clear(timer.id)
  }

  global.setInterval = function (fn, ms, ...args) {
    const permId = idCounter += 1

    function cb () {
      // we want to immediately poll again
      // because our permId was just cleared
      // from the queue stack
      poll()

      fn()
    }

    function poll () {
      return sendAndQueue(permId, cb, ms, args)
    }

    return poll()
  }

  return {
    child,

    queue,
  }
}

module.exports = {
  restore,

  fix,
}
