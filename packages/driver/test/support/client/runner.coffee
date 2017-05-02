socketReporter = require("./socket-reporter")

isSocketReporter = /reporter=socket/.test(location.search)

mocha.setup({
  ui: "bdd"
  reporter: if isSocketReporter then socketReporter else "html"
})

window.runner = mocha.run (failures) ->
  if not isSocketReporter
    console.log("Done. Failures: #{failures} / #{runner.total} . Duration: #{runner.stats.duration}")
