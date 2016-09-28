var z = require('zunder')
var u = z.undertaker
var setZunderConfig = require('./set-zunder-config')

setZunderConfig(z)

u.series(
  z.applyTestEnv,
  z.cleanTests,
  z.buildTestScripts,
  z.runTests
)()
