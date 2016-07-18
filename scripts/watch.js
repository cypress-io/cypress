var z = require('zunder')
var u = z.undertaker
var setZunderConfig = require('./set-zunder-config')

setZunderConfig(z)

u.parallel(
  z.watchScripts,
  z.watchStylesheets,
  z.watchStaticAssets
)()
