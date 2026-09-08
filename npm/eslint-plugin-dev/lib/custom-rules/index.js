const fs = require('fs')
const path = require('path')

// Rules authored in TypeScript are required directly - Node strips their types
const ruleExtension = /\.[jt]s$/u

module.exports =
  // eslint-disable-next-line no-restricted-syntax
  Object.assign({}, ...fs.readdirSync(__dirname)
  .filter((filename) => ruleExtension.test(filename) && filename !== 'index.js')
  .map((filename) => ({ [filename.replace(ruleExtension, '')]: require(path.resolve(__dirname, filename)) })))
