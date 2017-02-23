module.exports = (mode, options) ->
  switch mode
    when "record"
      require("../modes/record").run(options)
    when "headless"
      require("../modes/headless").run(options)
    when "headed"
      require("../modes/headed").run(options)
