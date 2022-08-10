import { attemptDownload } from '../src/mksnapshot-download'
import { expect } from 'chai'

describe('download', () => {
  ['12.0.10', '14.0.0-beta.3'].forEach((version) => {
    it(`downloads providing version ${version}`, async () => {
      const file = await attemptDownload(version, false)

      expect(file.startsWith(`mksnapshot-v${version}`), `downloads correcly versioned ${file}`).to.be.true
    })
  })
})
