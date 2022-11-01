// Reproduces execa code using lib errname which needs to be deferred

const errname = require('./lib/errname')

module.exports = function getErrname(n) {
  return errname(n)
}
