const cp = require('child_process')
const Bluebird = require('bluebird')

const exec = Bluebird.promisify(cp.exec)

const forceDelete = function (path) {
  // fs.unlinkAsync is unreliable on Windows, throws EPERM errors
  // when trying to delete npm install'd files
  return exec(`del /F /Q ${path}`)
}

module.exports = {
  forceDelete,
}
