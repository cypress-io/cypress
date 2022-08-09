console.time('entire-startup')

let express

// hookRequire()
// loadExpress()
// launchExpress()()

function hookRequire() {
  const path = require('path')
  const projectBaseDir = path.resolve(__dirname, '..')
  const _ = require('../..').snapshotRequire(projectBaseDir)
}

function loadExpress() {
  console.time('init-express')
  console.time('load-express')
  express = require('express')
  console.timeEnd('load-express')
}

function launchExpress() {
  console.time('start-express-after-loaded')
  const app = express()
  const port = 3000
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
    console.timeEnd('start-express-after-loaded')
    console.timeEnd('init-express')
    console.timeEnd('entire-startup')
  })
}
