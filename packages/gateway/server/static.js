const express = require('express')
const app = express()
const path = require('path')

const start = () => {
  app.use('/', express.static(`${__dirname}/`))
  app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')))

  return app.listen(3001)
}

module.exports = {
  start,
}
