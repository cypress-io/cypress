moment    = require("moment")
pluralize = require("pluralize")

parse = (ms) ->
  mins = 0

  duration = moment.duration(ms)

  hours = duration.hours()

  mins = hours * 60

  return {
    mins
    hours
    duration
  }

long = (ms) ->
  msg = []

  { mins, duration } = parse(ms)

  if mins += duration.minutes()
    word = pluralize("minute", mins)
    msg.push(mins + " " + word)

  secs = duration.seconds()

  word = pluralize("second", secs)

  msg.push(secs + " " + word)

  msg.join(", ")

short = (ms) ->
  msg = []

  { mins, duration } = parse(ms)

  if mins += duration.minutes()
    msg.push(mins + "m")

  secs = duration.seconds()

  if secs
    msg.push(secs + "s")
  else
    if not mins
      millis = duration.milliseconds()

      if millis
        msg.push(millis + "ms")
      else
        msg.push(secs + "s")

  msg.join(", ")

module.exports = {
  long

  short
}
