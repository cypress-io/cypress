_     = require("lodash")
chalk = require("chalk")

TRANSLATION = {
  tests:        "Tests"
  passes:       "Passes"
  failures:     "Failures"
  pending:      "Pending"
  duration:     "Duration"
  screenshots:  "Screenshots"
  video:        "Video Recorded"
  version:      "Cypress Version"
}

KEYS =  _.keys(TRANSLATION)
LENS =  _.map TRANSLATION, (val, key) -> val.length
MAX  = Math.max(LENS...)

module.exports = {
  format: (color, val, key) ->
    word = "  - " + TRANSLATION[key] + ":"

    key = _.padEnd(word, MAX + 6)

    chalk.white(key) + chalk[color](val)

  display: (color, stats = {}) ->
    stats = _.pick(stats, KEYS)

    _.each stats, (val, key) =>
      console.log(@format(color, val, key))

}
