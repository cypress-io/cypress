api = require("./api")
socketReporter = require("./socket-reporter")

isSocketReporter = /reporter=socket/.test(location.search)

mocha.setup({
  ui: "bdd"
  reporter: if isSocketReporter then socketReporter else "html"
})

api.listenForRun()

## preserve query string between pages
link = document.getElementById("spec-list")
link.href = "#{link.href}#{location.search}"

window.runner = mocha.run (failures) ->
  if not isSocketReporter
    console.log("Done. Failures: #{failures} / #{runner.total} . Duration: #{runner.stats.duration}")
