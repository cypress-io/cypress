const cp = require('child_process')
const Bluebird = require('bluebird')

const exec = Bluebird.promisify(cp.exec)

const forceDeleteDir = function (path) {
  // fs.unlinkAsync is unreliable on Windows, throws EPERM errors
  // when trying to delete npm install'd folders
  return exec(`rmdir /S /Q ${path}`)
}

module.exports = {
  forceDeleteDir,
}
