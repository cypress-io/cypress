_           = require("lodash")
chalk       = require("chalk")
ProgressBar = require("progress")

module.exports = {
  create: (message, options = {}) ->
    _.defaults(options, {
      total: 100
      width: 30
    })

    ascii = [
      chalk.white("  -")
      chalk.blue(message)
      chalk.yellow("[:bar]")
      chalk.white(":percent")
      chalk.gray(":etas")
    ]

    bar = new ProgressBar(ascii.join(" "), {
      total: options.total
      width: options.width
    })

    ticked = 0
    total  = options.total

    clear = ->
      bar.clear = true
      bar.terminate()

    tick = (num) ->
      ticked += num

      bar.tick(num)

    tickTotal = (float) ->
      ## calculate the overall progress
      ## of how full the bar should now be
      ## taking into account the total and
      ## the current ticks

      ## return us the absolute total
      ## we need to tick up to to fill
      ## our progress bar
      abs = total * float

      ## now subtract what we've already
      ## ticked to get the difference
      ## of what we need to tick up to
      diff = abs - ticked

      tick(diff)

    return {
      bar:   bar
      tick:  tick
      clear: clear
      tickTotal: tickTotal
    }
}