import spawnMock from 'spawn-mock'

// sinon is assumed to be available globally in test environment
declare const sinon: any

export default {
  mockSpawn (cb: (cp: any) => any): any {
    return spawnMock.mockSpawn((cp: any) => {
      // execa expects .cancel to exist
      cp.cancel = sinon.stub()

      return cb(cp)
    })
  },
}
