var z = require('zunder')
var u = z.undertaker
var copyScripts = require('./copy-scripts')
var setZunderConfig = require('./set-zunder-config')

setZunderConfig(z)

u.series(
  z.applyProdEnv,
  z.cleanProd,
  z.buildDevHtml,
  z.buildDevScripts,
  z.buildProdStylesheets,
  z.buildProdStaticAssets,
  copyScripts(z.config.prodDir)
)()
