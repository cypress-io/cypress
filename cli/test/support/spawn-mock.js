const spawnMock = require('spawn-mock')

module.exports = {
  mockSpawn (cb) {
    return spawnMock.mockSpawn((cp) => {
      // execa expects .cancel to exist
      cp.cancel = sinon.stub()

      return cb(cp)
    })
  },
}
