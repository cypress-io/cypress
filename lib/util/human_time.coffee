moment    = require("moment")
pluralize = require("pluralize")

module.exports = (ms) ->
  msg = []

  mins = 0

  duration = moment.duration(ms)

  hours = duration.hours()

  mins = hours * 60

  if mins += duration.minutes()
    word = pluralize("minute", mins)
    msg.push(mins + " " + word)

  secs = duration.seconds()

  word = pluralize("second", secs)

  msg.push(secs + " " + word)

  msg.join(", ")