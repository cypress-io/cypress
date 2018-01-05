_     = require("lodash")
R     = require("ramda")
chalk = require("chalk")
la    = require("lazy-ass")
check = require("check-more-types")
addObjects = require("add-objects")

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

nonNegative = (x) ->
  check.number(x) && x >= 0

module.exports = {
  format: (color, val, key) ->
    word = "  - " + TRANSLATION[key] + ":"

    key = _.padEnd(word, MAX + 6)

    chalk.white(key) + chalk[color](val)

  display: (color, stats = {}) ->
    stats = _.pick(stats, KEYS)

    _.each stats, (val, key) =>
      console.log(@format(color, val, key))

  # returns new stats object with default properties
  create: (attributes = {}) ->
    stats = {
      error:        null  # TODO should it be a list of errors?
      failures:     0
      tests:        0
      passes:       0
      pending:      0
      duration:     0     # TODO should it be ms?
      failingTests: []
    }
    R.merge(stats, attributes)

  isStats: check.schema({
    error: check.maybe.unemptyString,
    failures: nonNegative,
    tests: nonNegative,
    passes: nonNegative,
    pending: nonNegative,
    duration: nonNegative,
    failingTests: check.array
  })

  verifyStats: (listOfStats) ->
    la(check.array(listOfStats), "expected a list of stats", listOfStats)
    listOfStats.forEach (stats) =>
      la(@isStats(stats), "not a valid stats object", stats)

  # given a list of stats objects returns a combined
  # single stats object where all stats are added
  combine: (listOfStats) ->
    @verifyStats(listOfStats)

    if check.empty(listOfStats)
      return @create()

    combineStats = addObjects({
      error: R.or
      failures: R.add
      tests: R.add
      passes: R.add
      pending: R.add
      duration: R.add
      failingTests: R.concat
    })

    listOfStats.reduce(combineStats, @create())
}
