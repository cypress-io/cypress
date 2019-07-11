const z = require('zunder')
const u = z.undertaker
const setZunderConfig = require('./set-zunder-config')

setZunderConfig(z)

u.series(
  z.applyProdEnv,
  z.cleanProd,
  z.buildDevStaticAssets,
  z.buildDevScripts,
  z.buildDevStylesheets
)()
