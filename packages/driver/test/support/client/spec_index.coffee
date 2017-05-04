require("./api").listenForRun()

## preserve query string between pages
Array.from(document.querySelectorAll('a')).forEach (link) ->
  link.href = "#{link.href}#{location.search}"
