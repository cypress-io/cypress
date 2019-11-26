const tty = require('tty')
const terminalSize = require('./terminal-size')

// polyfills node's getWindowSize
// by returning an array of columns/rows
function getWindowSize () {
  const { columns, rows } = terminalSize.get()

  return [columns, rows]
}

function patchStream (patched, name) {
  const stream = process[name]

  stream.isTTY = true

  patched[stream.fd] = true
}

const override = () => {
  const isatty = tty.isatty

  const patched = {
    0: false,
    1: false,
    2: false,
  }

  // polyfill in node's getWindowSize
  // if it doesn't exist on stdout and stdin
  // (if we are a piped process) or we are
  // in windows on electron
  ;['stdout', 'stderr'].forEach((fn) => {
    if (!process[fn].getWindowSize) {
      process[fn].getWindowSize = getWindowSize
    }
  })

  tty.isatty = function (fd) {
    if (patched[fd]) {
      // force stderr to return true
      return true
    }

    // else pass through
    return isatty.call(tty, fd)
  }

  if (process.env.FORCE_STDIN_TTY === '1') patchStream(patched, 'stdin')

  if (process.env.FORCE_STDOUT_TTY === '1') patchStream(patched, 'stdout')

  if (process.env.FORCE_STDERR_TTY === '1') patchStream(patched, 'stderr')

  return
}

module.exports = {
  override,

  getWindowSize,
}
