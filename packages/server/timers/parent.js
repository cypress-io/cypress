// electron has completely busted timers resulting in
// all kinds of bizarre timeouts and unresponsive UI
// https://github.com/electron/electron/issues/7079
//
// this fixes this problem by replacing all the global
// timers and implementing a lightweight queuing mechanism
// involving a forked process

const cp = require('child_process')
const path = require('path')

const queue = {}

let idCounter = 0

function clear (id) {
  delete queue[id]
}

function sendAndQueue (id, cb, ms) {
  // const started = Date.now()

  queue[id] = {
    // started,
    ms,
    cb,
  }

  child.send({
    id,
    ms,
  })

  // return the timer id
  return id
}

// fork the child process
const child = cp.fork(path.join(__dirname, 'child.js'), [], {
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

  const { cb } = msg

  clear(id)

  cb()
})

global.setTimeout = function (cb, ms) {
  idCounter += 1

  return sendAndQueue(idCounter, cb, ms)
}

global.clearTimeout = function (id) {
  // return undefined per the spec
  clear(id)
}

global.clearInterval = function (id) {
  // return undefined per the spec
  clear(id)
}

global.setInterval = function (fn, ms) {
  const permId = idCounter += 1

  function cb () {
    fn()

    poll()
  }

  function poll () {
    // const started = Date.now()

    sendAndQueue(permId, cb, ms)
  }

  poll()

  return permId
}
