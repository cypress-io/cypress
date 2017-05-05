api = require("./api")
socketReporter = require("./socket_reporter")

isSocketReporter = /reporter=socket/.test(location.search)

mocha.setup({
  ui: "bdd"
  reporter: if isSocketReporter then socketReporter else "html"
})

api.listenForRun()

## preserve query string between pages
link = document.getElementById("spec-list")
link.href = "#{link.href}#{location.search}"

window.onerror = (message, source, lineno, colno, err) ->
  api.sendError(err)

window.onunhandledrejection = (event) ->
  api.sendError(event?.reason or event)

window.runner = mocha.run (failures) ->
  if not isSocketReporter
    console.log("Done. Failures: #{failures} / #{runner.total} . Duration: #{runner.stats.duration}")
