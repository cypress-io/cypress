'use strict'

function foo(exports, module, __filename, __dirname, require) {
  const bar = require('./bar')
  exports.value = 1
  exports.sum = bar + exports.value
}

function bar(exports, module, __filename, __dirname, require) {
  module.exports = 1
}

function entry(exports, module, __filename, __dirname, require) {
  const { sum } = require('./foo')
  module.exports = { result: sum + sum, origin: 'definitions' }
}

module.exports = {
  './foo.js': foo,
  './bar.js': bar,
  './entry.js': entry,
}
