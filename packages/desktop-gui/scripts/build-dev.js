const z = require('zunder')
const u = z.undertaker

require('./set-zunder-config')()

u.series(
  z.applyDevEnv,
  z.cleanDev,
  z.buildDevHtml,
  z.buildDevScripts,
  z.buildDevStylesheets,
  z.buildDevStaticAssets
)()
