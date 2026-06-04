import '../../../spec_helper'
import { BundleError } from '../../../../lib/cloud/bundles/bundle_error'

describe('BundleError', () => {
  it('carries kind and stage tags', () => {
    const err = new BundleError({ kind: 'cy-prompt', stage: 'signature', message: 'bad sig' })

    expect(err).to.be.instanceOf(Error)
    expect(err.name).to.equal('BundleError')
    expect(err.kind).to.equal('cy-prompt')
    expect(err.stage).to.equal('signature')
    expect(err.message).to.equal('bad sig')
  })

  it('preserves the cause when provided', () => {
    const cause = new Error('upstream')
    const err = new BundleError({ kind: 'studio', stage: 'network', message: 'wrapper', cause })

    expect((err as Error & { cause?: unknown }).cause).to.equal(cause)
  })

  it('isBundleError narrows the type and returns true for own instances', () => {
    const err = new BundleError({ kind: 'studio', stage: 'extract', message: 'm' })

    expect(BundleError.isBundleError(err)).to.equal(true)
    expect(BundleError.isBundleError(new Error('plain'))).to.equal(false)
    expect(BundleError.isBundleError(undefined)).to.equal(false)
  })

  it('mirrors the cause syscall code on the BundleError itself', () => {
    const cause = Object.assign(new Error('cert err'), { code: 'CERT_HAS_EXPIRED' })
    const err = new BundleError({ kind: 'studio', stage: 'network', message: 'wrapper', cause })

    expect(err.code).to.equal('CERT_HAS_EXPIRED')
  })

  it('mirrors errno and syscall from the cause (fs errors)', () => {
    const cause = Object.assign(new Error('rename failed'), { code: 'EPERM', errno: -4048, syscall: 'rename' })
    const err = new BundleError({ kind: 'cy-prompt', stage: 'publish', message: 'wrapper', cause })

    expect(err.code).to.equal('EPERM')
    expect(err.errno).to.equal(-4048)
    expect(err.syscall).to.equal('rename')
  })

  it('leaves errno and syscall undefined when the cause lacks them', () => {
    const err = new BundleError({ kind: 'studio', stage: 'publish', message: 'm', cause: new Error('plain') })

    expect(err.errno).to.equal(undefined)
    expect(err.syscall).to.equal(undefined)
  })

  it('leaves code undefined when cause has no string code', () => {
    const err1 = new BundleError({ kind: 'studio', stage: 'extract', message: 'm' })

    expect(err1.code).to.equal(undefined)

    const err2 = new BundleError({ kind: 'studio', stage: 'extract', message: 'm', cause: new Error('plain') })

    expect(err2.code).to.equal(undefined)

    const err3 = new BundleError({ kind: 'studio', stage: 'extract', message: 'm', cause: { code: 42 } })

    expect(err3.code).to.equal(undefined)
  })
})
