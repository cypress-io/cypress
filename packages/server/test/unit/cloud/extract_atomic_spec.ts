import { proxyquire, sinon } from '../../spec_helper'

describe('renameAtomicWithRetry', () => {
  let renameAtomicWithRetry: typeof import('../../../lib/cloud/extract_atomic').renameAtomicWithRetry
  let renameStub: sinon.SinonStub

  beforeEach(() => {
    renameStub = sinon.stub()

    renameAtomicWithRetry = (proxyquire('../lib/cloud/extract_atomic', {
      'fs-extra': {
        ensureDir: sinon.stub().resolves(),
        rename: renameStub,
      },
    })).renameAtomicWithRetry
  })

  it('should rename once when the operation succeeds', async () => {
    renameStub.resolves()

    await renameAtomicWithRetry('/src/file', '/dst/file')

    expect(renameStub).to.be.calledOnce
    expect(renameStub).to.be.calledWith('/src/file', '/dst/file')
  })

  it('should retry on EPERM and succeed on a subsequent attempt', async () => {
    const epermError = Object.assign(new Error('EPERM: operation not permitted, rename'), { code: 'EPERM' })

    renameStub.onFirstCall().rejects(epermError)
    renameStub.onSecondCall().resolves()

    await renameAtomicWithRetry('/src/file', '/dst/file')

    expect(renameStub).to.be.calledTwice
  })

  it('should retry on EACCES and succeed on a subsequent attempt', async () => {
    const eaccesError = Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' })

    renameStub.onFirstCall().rejects(eaccesError)
    renameStub.onSecondCall().resolves()

    await renameAtomicWithRetry('/src/file', '/dst/file')

    expect(renameStub).to.be.calledTwice
  })

  it('should retry on EBUSY (Windows: file in use by AV / another process) and succeed on a subsequent attempt', async () => {
    const ebusyError = Object.assign(new Error('EBUSY: resource busy or locked'), { code: 'EBUSY' })

    renameStub.onFirstCall().rejects(ebusyError)
    renameStub.onSecondCall().resolves()

    await renameAtomicWithRetry('/src/file', '/dst/file')

    expect(renameStub).to.be.calledTwice
  })

  it('should throw the last error when EPERM persists past the retry budget', async () => {
    const epermError = Object.assign(new Error('EPERM: operation not permitted, rename'), { code: 'EPERM' })

    renameStub.rejects(epermError)

    await expect(renameAtomicWithRetry('/src/file', '/dst/file')).to.be.rejectedWith(epermError)
    // MAX_RETRIES = 3, so 4 total attempts (initial + 3 retries)
    expect(renameStub.callCount).to.equal(4)
  })

  it('should not retry on non-retryable errors such as ENOENT', async () => {
    const enoentError = Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' })

    renameStub.rejects(enoentError)

    await expect(renameAtomicWithRetry('/src/file', '/dst/file')).to.be.rejectedWith(enoentError)
    expect(renameStub).to.be.calledOnce
  })

  it('should not retry on errors without an EPERM/EACCES code', async () => {
    const opaqueError = new Error('something else went wrong')

    renameStub.rejects(opaqueError)

    await expect(renameAtomicWithRetry('/src/file', '/dst/file')).to.be.rejectedWith(opaqueError)
    expect(renameStub).to.be.calledOnce
  })
})
