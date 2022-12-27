'use strict'

let stealthyRequire = require('../../lib/index.js')

let req1 = require('../fixtures/sync-deps.js')
let req2 = stealthyRequire(require.cache, function () {
  return require('./deep-sync-deps.js')
},
function () {
  require('../fixtures/sync-deps.js')
}, module)
let req3 = require('../fixtures/sync-deps.js')

console.log(JSON.stringify(req1))
console.log(JSON.stringify(req2.dep))
console.log(JSON.stringify(req3))
