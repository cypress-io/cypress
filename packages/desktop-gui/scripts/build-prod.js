const z = require('zunder')
const u = z.undertaker

require('./set-zunder-config')()

u.series(
  z.applyProdEnv,
  z.cleanProd,
  z.buildDevHtml,
  z.buildDevScripts,
  z.buildProdStylesheets,
  z.buildProdStaticAssets
)()
