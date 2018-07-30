require('../../spec_helper')

const util = require(`${lib}/util`)
const state = require(`${lib}/tasks/state`)
const versions = require(`${lib}/exec/versions`)

describe('lib/exec/versions', function () {
  beforeEach(function () {
    sinon.stub(state, 'getBinaryDir').returns('/cache/1.2.3/Cypress.app')
    sinon.stub(state, 'getBinaryPkgVersionAsync').withArgs('/cache/1.2.3/Cypress.app').resolves('1.2.3')
    sinon.stub(util, 'pkgVersion').returns('4.5.6')
  })
  describe('.getVersions', function () {
    it('gets the correct binary and package version', function () {
      return versions.getVersions().then(({ package, binary }) => {
        expect(package).to.eql('4.5.6')
        expect(binary).to.eql('1.2.3')
      })
    })
    it('gets correct binary version if CYPRESS_RUN_BINARY', function () {
      sinon.stub(state, 'parseRealPlatformBinaryFolderAsync').resolves('/my/cypress/path')
      process.env.CYPRESS_RUN_BINARY = '/my/cypress/path'
      state.getBinaryPkgVersionAsync
      .withArgs('/my/cypress/path')
      .resolves('7.8.9')
      return versions.getVersions().then(({ package, binary }) => {
        expect(package).to.eql('4.5.6')
        expect(binary).to.eql('7.8.9')
      })
    })
  })
})
