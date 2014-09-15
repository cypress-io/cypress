page    = require("webpage").create()
system  = require('system')

page.open system.args[1], ->
  console.log "phantom exiting"
  phantom.exit()