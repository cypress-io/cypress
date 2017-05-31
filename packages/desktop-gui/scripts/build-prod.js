const z = require('zunder')
const u = z.undertaker
const copyScripts = require('./copy-scripts')
const setZunderConfig = require('./set-zunder-config')

setZunderConfig(z)

u.series(
  z.applyProdEnv,
  z.cleanProd,
  u.parallel(
    z.buildDevHtml,
    z.buildDevScripts,
    z.buildProdStylesheets,
    z.buildProdStaticAssets,
    copyScripts(z.config.prodDir)
  )
)()
