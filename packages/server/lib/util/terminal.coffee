_     = require("lodash")
chalk = require("chalk")

module.exports = {
  header: (message, options = {}) ->
    _.defaults(options, {
      color: null
    })

    message = "  (" + chalk.underline.bold(message) + ")"

    if c = options.color
      colors = [].concat(c)

      message = _.reduce colors, (memo, color) ->
        chalk[color](memo)
      , message

    console.log(message)

  divider: (message, options = {}) ->
    _.defaults(options, {
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
      console.log("")

    console.log(message)

    if options.postBreak
      console.log("")

}
