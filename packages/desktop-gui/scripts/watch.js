const z = require('zunder')
const u = z.undertaker

require('./set-zunder-config')()

u.series(
  z.applyDevEnv,
  z.cleanDev,
  u.parallel(
    z.watchHtml,
    z.watchScripts,
    z.watchStylesheets,
    z.watchStaticAssets
  )
)()
