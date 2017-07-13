module.exports = (mode, options) ->
  switch mode
    when "record"
      require("./record").run(options)
    when "headless"
      require("./headless").run(options)
    when "headed"
      require("./headed").run(options)
    when "driver"
      require("./driver").run(options)
