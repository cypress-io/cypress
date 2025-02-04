const util = require('../util')

module.exports = {
  wrapBefore (ipc, invoke, ids, args) {
    util.wrapChildPromise(ipc, invoke, ids, args)
  },
}
