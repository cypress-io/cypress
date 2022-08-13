// This module is inside the snapshot and requires one that is external by default.
const bluebird = require('bluebird')

function resolveBluebird () {
  return bluebird
}

module.exports = resolveBluebird
