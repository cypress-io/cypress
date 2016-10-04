var zunder = require("zunder")
var copyScripts = require('./scripts/copy-scripts')
var setZunderConfig = require('./scripts/set-zunder-config')

setZunderConfig(zunder)

zunder.on("before:watch", copyScripts(zunder.config.devDir))
zunder.on("before:build-dev", copyScripts(zunder.config.devDir))
