const tty = require('tty')

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

  if (!tty.getWindowSize) {
    // this is really old method, long removed from Node, but Mocha
    // reporters fall back on it if they cannot use `process.stdout.getWindowSize`
    // we need to polyfill it as long as we use Mocha@2 in packages/server
    tty.getWindowSize = function () {
      // returns [height, width]
      return [40, 80]
    }
  }

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
}
