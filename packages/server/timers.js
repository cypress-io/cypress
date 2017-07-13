const cp = require('child_process')
const path = require('path')
// const ms = .001

const timers = {}

let id = 0

clear = function(id) {
  delete timers[id]
}

global.setTimeout = function (cb, ms) {
  id++
  const started = Date.now()
  const sp = cp.spawn(path.join(__dirname, 'timer.sh'), [ms / 1000])
  .on('exit', () => {
    clear(id)
    const finished = Date.now() - started
    console.log('Finished after', finished, 'Was supposed to take', ms)
    cb()
  })

  timers[id] = sp

  // return the timer id
  return id
  // const err = new Error
  // console.log("SET TIMEOUT", err.stack)
}

// TODO: what should this return?
global.clearTimeout = function (id) {
  clear(id)
}
