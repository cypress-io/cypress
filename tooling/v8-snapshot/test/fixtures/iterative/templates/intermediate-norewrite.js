// @ts-check
// This problematic code has been taken from graceful-fs/polyfill.js
// It results in invalid code when rewritten.

require('./norewrite')

var origCwd = process.cwd
var cwd = null

process.cwd = function () {
  if (!cwd) cwd = origCwd.call(process)
  return cwd
}

module.exports = patch

function patch(fs) {
  fs.patchedCwd = process.cwd()
}
