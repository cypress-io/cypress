/* eslint-env mocha */
describe('upload util', () => {
  const upload = require('../../../binary/util/upload')

  context('isValidPlatformArch', () => {
    const { isValidPlatformArch } = upload

    it('checks given strings', () => {
      const valid = upload.validPlatformArchs
      const invalid = ['darwin', 'win32', 'windows', 'linux', 'linux64']

      snapshot(isValidPlatformArch, ...valid, ...invalid)
    })
  })
})
