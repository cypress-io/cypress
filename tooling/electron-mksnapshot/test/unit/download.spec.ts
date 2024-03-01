import { config } from '../../src/config'
import { expect } from 'chai'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

const { platform } = config
let { archToDownload } = config

if (
  archToDownload != null &&
  archToDownload.startsWith('arm') &&
  process.platform !== 'darwin'
) {
  archToDownload += '-x64'
}

describe('download', () => {
  ['12.0.10', '14.0.0-beta.3'].forEach((version) => {
    it(`downloads providing version ${version}`, async () => {
      const downloadArtifact = sinon.stub()

      const { attemptDownload } = proxyquire('../../src/mksnapshot-download', {
        '@electron/get': { downloadArtifact },
        'extract-zip': sinon.stub(),
        'fs': { chmod: sinon.stub() },
      })

      downloadArtifact.withArgs({
        version,
        artifactName: 'mksnapshot',
        platform,
        arch: archToDownload,
      }).resolves(`mksnapshot-v${version}.zip`)

      const file = await attemptDownload(version, false)

      expect(file.startsWith(`mksnapshot-v${version}`), `downloads correctly versioned ${file}`).to.be.true
    })
  })
})
