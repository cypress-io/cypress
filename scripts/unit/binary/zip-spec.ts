import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

use(chaiAsPromised)
use(sinonChai)

describe('zip', () => {
  context('#ditto on darwin', () => {
    let execa: sinon.SinonStub
    let zip

    beforeEach(() => {
      execa = sinon.stub().resolves()
      zip = proxyquire.noCallThru()('../../binary/zip', {
        execa,
        os: { platform: () => 'darwin' },
      })
    })

    afterEach(() => {
      sinon.restore()
    })

    it('strips com.apple.provenance from the app before zipping it', async () => {
      const dest = await zip.ditto('/build/Cypress.app', '/cypress.zip')

      expect(dest).to.eq('/cypress.zip')

      const xattr = execa.withArgs('xattr', ['-r', '-s', '-d', 'com.apple.provenance', '/build/Cypress.app'])
      const ditto = execa.withArgs('ditto -c -k --sequesterRsrc --keepParent /build/Cypress.app /cypress.zip')

      expect(xattr).to.have.been.calledOnce
      expect(ditto).to.have.been.calledOnce
      expect(xattr).to.have.been.calledBefore(ditto)
    })

    it('does not zip when stripping the attribute fails', async () => {
      execa.withArgs('xattr').rejects(new Error('xattr failed'))

      await expect(zip.ditto('/build/Cypress.app', '/cypress.zip')).to.be.rejectedWith('xattr failed')

      expect(execa).not.to.have.been.calledWithMatch(/^ditto /)
    })
  })
})
