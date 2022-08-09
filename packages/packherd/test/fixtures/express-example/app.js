'use strict'

const express = require('express')

launchExpress()

function launchExpress() {
  const app = express()
  const port = 3000
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
}
