var z = require('zunder')
var u = z.undertaker
var setZunderConfig = require('./set-zunder-config')

setZunderConfig(z)

u.series(
  z.applyDevEnv,
  z.cleanDev,
  u.parallel(
    z.watchScripts,
    z.watchTests,
    z.watchStylesheets,
    z.watchStaticAssets
  )
)()
