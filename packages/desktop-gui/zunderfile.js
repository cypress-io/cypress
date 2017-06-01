const zunder = require('zunder')
const copyScripts = require('./scripts/copy-scripts')
const setZunderConfig = require('./scripts/set-zunder-config')

setZunderConfig(zunder)

zunder.on('before:watch', copyScripts(zunder.config.devDir))
zunder.on('before:build-dev', copyScripts(zunder.config.devDir))
