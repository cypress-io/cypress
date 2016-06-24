var zunder = require('zunder')
var setZunderConfig = require('./set-zunder-config')

setZunderConfig(zunder)

zunder.undertaker.parallel(
  zunder.watchScripts,
  zunder.watchStylesheets,
  zunder.watchStaticAssets
)()
