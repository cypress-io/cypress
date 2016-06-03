var zunder = require('zunder')
var copyFonts = require('./copy-fonts')

zunder.undertaker.parallel(
  copyFonts(zunder.config.prodDir),
  zunder.buildProdScripts,
  zunder.buildProdStylesheets,
  zunder.buildProdStaticAssets
)()
