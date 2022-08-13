'use strict'

let stealthyRequire = require('../../lib/index.js')

let req1 = require('../fixtures/sync-deps.js')
let req2 = stealthyRequire(require.cache, function () {
  return require('./sync-deps.js')
})
let req3 = require('../fixtures/sync-deps.js')

console.log(JSON.stringify(req1))
console.log(JSON.stringify(req2))
console.log(JSON.stringify(req3))
