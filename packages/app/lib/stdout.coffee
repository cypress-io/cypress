_write = process.stdout.write

module.exports = {
  capture: ->
    logs = []

    ## lazily backup write to enable
    ## injection
    write = process.stdout.write

    process.stdout.write = (str) ->
      logs.push(str)

      write.apply(@, arguments)

    return {
      toString: -> logs.join("")

      data: logs
    }

  restore: ->
    ## restore to the original write
    process.stdout.write = _write
}
