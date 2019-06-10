const _ = require('lodash')
const fs = require('fs')
const tty = require('tty')

function writeThruAsync (fd) {
  return function write (chunk, enc, cb) {
    fs.write(fd, chunk, null, enc, cb || _.noop)
  }
}

/**
 * Make stdout and stderr consistently act as asynchronous writes, not synchronous.
 * Synchronous writes can block the execution of things we actually care about.
 *
 * https://github.com/cypress-io/cypress/pull/4385#issuecomment-500543325
 * https://nodejs.org/api/process.html#process_a_note_on_process_i_o
 */
function makeAsync () {
  if (process.env.DISABLE_ASYNC_STDIO) {
    return
  }

  if (process.platform === 'win32') {
    // TTYs are asynchronous on Windows
    return
  }

  [
    [1, process.stdout],
    [2, process.stderr],
  ].map(([fd, str]) => {
    if (tty.isatty(fd)) {
      // TTYs are synchronous on POSIX, make it async
      str.write = writeThruAsync(fd)
    }
  })
}

module.exports = {
  makeAsync,
}
