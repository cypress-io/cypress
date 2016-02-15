module.exports = (mode, options) ->
  switch mode
    when "ci"
      require("../modes/ci").run(options)
    when "headless"
      require("../modes/headless").run(options)
    when "headed"
      require("../modes/headed").run(options)