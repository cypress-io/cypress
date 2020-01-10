const findProcess = require('find-process')

const byPid = (pid) => {
  return findProcess('pid', pid)
}

module.exports = {
  byPid,
}
