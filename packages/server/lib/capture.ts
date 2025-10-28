const _write = process.stdout.write
// @ts-expect-error - process.log is not defined in the type system
const _log = process.log

export const restore = function () {
  // restore to the originals
  process.stdout.write = _write
  // @ts-expect-error
  process.log = _log
}

export const stdout = function () {
  const logs: string[] = []

  // lazily backup write to enable injection
  const { write } = process.stdout
  // @ts-expect-error
  const { log } = process

  // electron adds a new process.log
  // method for windows instead of process.stdout.write
  // https://github.com/cypress-io/cypress/issues/977
  if (log) {
    // @ts-expect-error
    process.log = function (str: string) {
      logs.push(str)

      return log.apply(this, arguments)
    }
  }

  process.stdout.write = function (str: string) {
    logs.push(str)

    // @ts-expect-error
    return write.apply(this, arguments)
  }

  return {
    toString () {
      return logs.join('')
    },

    data: logs,

    restore,
  }
}
