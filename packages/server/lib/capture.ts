declare global {
  namespace NodeJS {
    interface Process {
      // Electron adds process.log on Windows
      log?: (str: string) => void
    }
  }
}

const _write = process.stdout.write
const _log = process.log

export const restore = function () {
  // restore to the originals
  process.stdout.write = _write
  process.log = _log
}

export const stdout = function () {
  const logs: string[] = []

  // lazily backup write to enable injection
  const { write } = process.stdout
  const { log } = process

  // electron adds a new process.log
  // method for windows instead of process.stdout.write
  // https://github.com/cypress-io/cypress/issues/977
  if (log) {
    process.log = function (...args: [string, ...unknown[]]) {
      logs.push(args[0])

      // @ts-expect-error - the rest tuple does not match process.log's parameter tuple
      return log.apply(this, args)
    }
  }

  process.stdout.write = function (...args: [string, ...unknown[]]) {
    logs.push(args[0])

    // @ts-expect-error - the rest tuple does not match stdout.write's parameter tuple
    return write.apply(this, args)
  }

  return {
    toString () {
      return logs.join('')
    },

    data: logs,

    restore,
  }
}
