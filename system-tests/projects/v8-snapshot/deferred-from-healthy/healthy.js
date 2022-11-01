// This module is inside the snapshot and requires one that is outside
// which means that the module negotiator has to resolve the relative path.
const deferred = require('./lib/deferred')

function resolveDeferred () {
  return deferred.toString()
}

module.exports = resolveDeferred
