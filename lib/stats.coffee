_     = require("lodash")
chalk = require("chalk")

TRANSLATION = {
  duration:     "Duration"
  tests:        "Tests"
  passes:       "Passes"
  failures:     "Failures"
  pending:      "Pending"
  screenshots:  "Screenshots Taken"
  video:        "Video Recorded"
}

KEYS =  _.keys(TRANSLATION)
LENS =  _.map TRANSLATION, (val, key) -> val.length
MAX  = Math.max(LENS...)

module.exports = {
  format: (val, key) ->
    word = TRANSLATION[key] + ":"

    key = _.padEnd(word, MAX + 2)

    chalk.white(key) + chalk.blue(val)

  display: (stats = {}) ->
    stats = _.pick(stats, KEYS)

    _.each stats, (val, key) =>
      console.log(@format(val, key))

}