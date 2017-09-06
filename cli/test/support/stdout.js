const _write = process.stdout.write

module.exports = {
  capture () {
    const logs = []

    const write = process.stdout.write

    process.stdout.write = function (str) {
      logs.push(str)

      /* eslint-disable prefer-rest-params */
      write.apply(this, arguments)
    }

    return {
      data: logs,

      toString: () => {
        return logs.join('')
      },
    }
  },

  restore () {
    process.stdout.write = _write
  },
}
