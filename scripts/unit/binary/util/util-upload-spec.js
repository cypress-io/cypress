const snapshot = require('snap-shot-it')

// I named this file util-upload-spec
// to avoid snapshots being saved into same file
// since "snap-shot-it" v8.x saves all snapshots into single folder

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
