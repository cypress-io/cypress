var zunder = require('zunder')
var copyFonts = require('./copy-fonts')

zunder.undertaker.parallel(
  copyFonts(zunder.config.devDir),
  zunder.watchScripts,
  zunder.watchStylesheets,
  zunder.watchStaticAssets
)()
