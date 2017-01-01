## backup write
write = process.stdout.write

module.exports = ->
  logs = []

  process.stdout.write = (str) ->
    logs.push(str)

    write.apply(@, arguments)

  return {
    toString: -> logs.join("")

    data: logs

    restore: ->
      process.stdout.write = write
  }
