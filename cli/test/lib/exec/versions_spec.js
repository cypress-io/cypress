const { expect } = require('chai')

require('../../spec_helper')

const util = require(`${lib}/util`)
const state = require(`${lib}/tasks/state`)
const versions = require(`${lib}/exec/versions`)

describe('lib/exec/versions', function () {
  const binaryDir = '/cache/1.2.3/Cypress.app'

  beforeEach(function () {
    sinon.stub(state, 'getBinaryDir').returns(binaryDir)
    sinon.stub(state, 'getBinaryPkgAsync').withArgs(binaryDir).resolves({
      version: '1.2.3',
      electronVersion: '10.1.2',
      electronNodeVersion: '12.16.3',
    })

    sinon.stub(util, 'pkgVersion').returns('4.5.6')
    sinon.stub(util, 'pkgBuildInfo').returns({ stable: true })
  })

  describe('.getVersions', function () {
    it('gets the correct binary and package version', function () {
      return versions.getVersions().then(({ package, binary }) => {
        expect(package, 'package version').to.eql('4.5.6')
        expect(binary, 'binary version').to.eql('1.2.3')
      })
    })

    it('gets the correct Electron and bundled Node version', function () {
      return versions.getVersions().then(({ electronVersion, electronNodeVersion }) => {
        expect(electronVersion, 'electron version').to.eql('10.1.2')
        expect(electronNodeVersion, 'node version').to.eql('12.16.3')
      })
    })

    it('gets correct binary version if CYPRESS_RUN_BINARY', function () {
      sinon.stub(state, 'parseRealPlatformBinaryFolderAsync').resolves('/my/cypress/path')
      process.env.CYPRESS_RUN_BINARY = '/my/cypress/path'
      state.getBinaryPkgAsync
      .withArgs('/my/cypress/path')
      .resolves({
        version: '7.8.9',
      })

      return versions.getVersions().then(({ package, binary }) => {
        expect(package).to.eql('4.5.6')
        expect(binary).to.eql('7.8.9')
      })
    })

    it('appends pre-release if not stable', async function () {
      util.pkgBuildInfo.returns({ stable: false })

      const v = await versions.getVersions()

      expect(v.package).to.eql('4.5.6 (pre-release)')
    })

    it('appends development if missing buildInfo', async function () {
      util.pkgBuildInfo.returns(undefined)

      const v = await versions.getVersions()

      expect(v.package).to.eql('4.5.6 (development)')
    })

    it('reports default versions if not found', function () {
      // imagine package.json only has version there
      state.getBinaryPkgAsync.withArgs(binaryDir).resolves({
        version: '90.9.9',
      })

      return versions.getVersions().then((versions) => {
        expect(versions).to.deep.equal({
          'package': '4.5.6',
          'binary': '90.9.9',
          'electronVersion': 'not found',
          'electronNodeVersion': 'not found',
        })
      })
    })
  })
})
