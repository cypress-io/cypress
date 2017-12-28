const tty = require('tty')

const override = () => {
  // if we're being told to force STDERR
  if (process.env.FORCE_STDERR_TTY === '1') {
    const isatty = tty.isatty
    const _fd = process.stderr.fd

    process.stderr.isTTY = true

    tty.isatty = function (fd) {
      if (fd === _fd) {
        // force stderr to return true
        return true
      }

      // else pass through
      return isatty.call(this, fd)
    }
  }
}

module.exports = {
  override,
}
