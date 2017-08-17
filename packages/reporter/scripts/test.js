const z = require('zunder')
const u = z.undertaker
const setZunderConfig = require('./set-zunder-config')

setZunderConfig(z)

u.series(
  z.applyTestEnv,
  z.cleanTests,
  z.buildTestScripts,
  z.runTests
)()
