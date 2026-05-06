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
})
