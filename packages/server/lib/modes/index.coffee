module.exports = (mode, options) ->
  switch mode
    when "record"
      require("./record").run(options)
    when "run"
      require("./run").run(options)
    when "headed"
      require("./headed").run(options)
