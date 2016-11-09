chalk    = require("chalk")
defaults = require("lodash.defaults")

module.exports = {
  divider: (message, options = {}) ->
    defaults(options, {
      width:     100
      preBreak:  false
      postBreak: false
    })

    w = options.width / 2

    a = ->
      Array(Math.floor(w))

    message = " " + message + " "

    message = a().concat(message, a()).join("=")

    if c = options.color
      message = chalk[c](message)

    if options.preBreak
      console.log("\n")

    console.log(message)

    if options.postBreak
      console.log("\n")

}