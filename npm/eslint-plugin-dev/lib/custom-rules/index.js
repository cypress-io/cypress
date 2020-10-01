const fs = require('fs')
const path = require('path')

module.exports =
  Object.assign({}, ...fs.readdirSync(__dirname)
  .filter((filename) => filename.endsWith('.js') && filename !== 'index.js')
  .map((filename) => ({ [filename.replace(/\.js$/u, '')]: require(path.resolve(__dirname, filename)) })))
