page    = require("webpage").create()
system  = require('system')

t = Date.now()
console.log("opening page: ", system.args[1])

page.open system.args[1], ->
  console.log "finished page", Date.now() - t
  # phantom.exit()