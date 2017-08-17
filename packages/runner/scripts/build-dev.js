const z = require('zunder')
const u = z.undertaker
const setZunderConfig = require('./set-zunder-config')

setZunderConfig(z)

u.series(
  z.applyDevEnv,
  z.cleanDev,
  u.parallel(
    z.buildDevScripts,
    z.buildDevStylesheets,
    z.buildDevStaticAssets
  )
)()
