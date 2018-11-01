// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')
const chalk = require('chalk')
const ProgressBar = require('progress')

module.exports = {
  create (message, options = {}) {
    _.defaults(options, {
      total: 100,
      width: 30,
    })

    const ascii = [
      chalk.white('  -'),
      chalk.blue(message),
      chalk.yellow('[:bar]'),
      chalk.white(':percent'),
      chalk.gray(':etas'),
    ]

    const bar = new ProgressBar(ascii.join(' '), {
      total: options.total,
      width: options.width,
    })

    let ticked = 0
    const { total } = options

    const clear = function () {
      bar.clear = true

      return bar.terminate()
    }

    const tick = function (num) {
      ticked += num

      return bar.tick(num)
    }

    const tickTotal = function (float) {
      //# calculate the overall progress
      //# of how full the bar should now be
      //# taking into account the total and
      //# the current ticks

      //# return us the absolute total
      //# we need to tick up to to fill
      //# our progress bar
      const abs = total * float

      //# now subtract what we've already
      //# ticked to get the difference
      //# of what we need to tick up to
      const diff = abs - ticked

      return tick(diff)
    }

    return {
      bar,
      tick,
      clear,
      tickTotal,
    }
  },
}
