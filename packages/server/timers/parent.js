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
    stdio: 'inherit',
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

  // In linux apparently the child process is never
  // exiting which causes cypress to hang indefinitely.
  // It would **SEEM** as if we...
  // 1. dont need to manually kill our child process
  //    because it should naturally exit.
  //    (but of course it doesn't in linux)
  // 2. use our restore function already defined above.
  //    however when using the restore function above
  //    the 'child' reference is null. how is it null?
  //    it makes no sense. there must be a rip in the
  //    space time continuum, obviously. that or the
  //    child reference as the rest of the matter of
  //    the universe has succumbed to entropy.
  process.on('exit', () => {
    child && child.kill()

    restore()
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
