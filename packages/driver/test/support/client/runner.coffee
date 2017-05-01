reporter = require("./reporter")

window.runner = mocha.run (failures) ->
  console.log("Done. Failures: #{failures} / #{runner.total} . Duration: #{runner.stats.duration}")

reporter(runner)
