_write = process.stdout.write
_log = process.log

restore = ->
  ## restore to the originals
  process.stdout.write = _write
  process.log = _log

stdout = ->
  ## always restore right when we start capturing
  # restore()

  logs = []

  ## lazily backup write to enable
  ## injection
  write = process.stdout.write
  log = process.log

  ## electron adds a new process.log
  ## method for windows instead of process.stdout.write
  ## https://github.com/cypress-io/cypress/issues/977
  if log
    process.log = (str) ->
      logs.push(str)

      log.apply(@, arguments)

  process.stdout.write = (str) ->
    logs.push(str)

    write.apply(@, arguments)

  return {
    toString: -> logs.join("")

    data: logs

    restore
  }

module.exports = {
  stdout

  restore
}
