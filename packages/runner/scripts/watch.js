const z = require('zunder')
const u = z.undertaker
const setZunderConfig = require('./set-zunder-config')

setZunderConfig(z)

u.series(
  z.applyDevEnv,
  z.cleanDev,
  z.cleanTests,
  u.parallel(
    z.watchScripts,
    z.watchTests,
    z.watchStylesheets,
    z.watchStaticAssets
  )
)()
