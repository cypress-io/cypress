// const st = global.setTimeout
//
// global.setTimeout = function (cb, ms) {
//   const started = Date.now()
//
//   return st(() => {
//     const finished = Date.now() - started
//
//     console.log('Finished after', finished, 'Was supposed to take', ms)
//
//     cb()
//   }, ms)
// }
const cp = require('child_process')
const path = require('path')
// const ms = .001

const timings = {}
const msgs = {}
// const timers = {}

let idCounter = 0

function clear (id) {
  delete msgs[id]
}

const f = cp.fork(path.join(__dirname, 'timer.js'))
.on('message', (obj = {}) => {
  const { id } = obj

  const { started, ms } = timings[id]

  const finished = Date.now() - started

  console.log('Finished after', finished, '- Was supposed to take', ms, '- Off by', finished - ms)

  const msg = msgs[id]

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

// const sp = cp.spawn(path.join(__dirname, 'timer.sh'), [ms / 1000])

global.setTimeout = function (cb, ms) {
  idCounter += 1

  const started = Date.now()

  msgs[idCounter] = {
    started,
    ms,
    cb,
  }

  timings[idCounter] = {
    started,
    ms,
  }

  f.send({
    id: idCounter,
    ms,
  })
  // .on('exit', () => {
  //   clear(id)
  //   const finished = Date.now() - started
  //   console.log('Finished after', finished, 'Was supposed to take', ms)
  //   cb()
  // })

  // timers[id] = sp

  // return the timer id
  return idCounter
  // const err = new Error
  // console.log("SET TIMEOUT", err.stack)
}

// TODO: what should this return?
global.clearTimeout = function (id) {
  console.log('clearing timeout for id', id)

  clear(id)
}
