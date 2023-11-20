console.time('entire-startup')

let express

loadExpress()
launchExpress()

function loadExpress () {
  console.time('init-express')
  console.time('load-express')
  express = require('express')
  console.timeEnd('load-express')
}

function launchExpress () {
  console.time('start-express-after-loaded')
  const app = express()
  const port = 3001

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
    console.timeEnd('start-express-after-loaded')
    console.timeEnd('init-express')
    console.timeEnd('entire-startup')
  })
}
