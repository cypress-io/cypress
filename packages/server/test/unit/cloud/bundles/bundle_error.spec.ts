import { describe, it, expect } from 'vitest'
import { BundleError } from '../../../../lib/cloud/bundles/bundle_error'

describe('BundleError', () => {
  it('carries kind and stage tags', () => {
    const err = new BundleError({ kind: 'cy-prompt', stage: 'signature', message: 'bad sig' })

    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('BundleError')
    expect(err.kind).toBe('cy-prompt')
    expect(err.stage).toBe('signature')
    expect(err.message).toBe('bad sig')
  })

  it('preserves the cause when provided', () => {
    const cause = new Error('upstream')
    const err = new BundleError({ kind: 'studio', stage: 'network', message: 'wrapper', cause })

    expect((err as Error & { cause?: unknown }).cause).toBe(cause)
  })

  it('isBundleError narrows the type and returns true for own instances', () => {
    const err = new BundleError({ kind: 'studio', stage: 'extract', message: 'm' })

    expect(BundleError.isBundleError(err)).toBe(true)
    expect(BundleError.isBundleError(new Error('plain'))).toBe(false)
    expect(BundleError.isBundleError(undefined)).toBe(false)
  })

  it('mirrors the cause syscall code on the BundleError itself', () => {
    const cause = Object.assign(new Error('cert err'), { code: 'CERT_HAS_EXPIRED' })
    const err = new BundleError({ kind: 'studio', stage: 'network', message: 'wrapper', cause })

    expect(err.code).toBe('CERT_HAS_EXPIRED')
  })

  it('mirrors errno and syscall from the cause (fs errors)', () => {
    const cause = Object.assign(new Error('rename failed'), { code: 'EPERM', errno: -4048, syscall: 'rename' })
    const err = new BundleError({ kind: 'cy-prompt', stage: 'publish', message: 'wrapper', cause })

    expect(err.code).toBe('EPERM')
    expect(err.errno).toBe(-4048)
    expect(err.syscall).toBe('rename')
  })

  it('leaves errno and syscall undefined when the cause lacks them', () => {
    const err = new BundleError({ kind: 'studio', stage: 'publish', message: 'm', cause: new Error('plain') })

    expect(err.errno).toBe(undefined)
    expect(err.syscall).toBe(undefined)
  })

  it('leaves code undefined when cause has no string code', () => {
    const err1 = new BundleError({ kind: 'studio', stage: 'extract', message: 'm' })

    expect(err1.code).toBe(undefined)

    const err2 = new BundleError({ kind: 'studio', stage: 'extract', message: 'm', cause: new Error('plain') })

    expect(err2.code).toBe(undefined)

    const err3 = new BundleError({ kind: 'studio', stage: 'extract', message: 'm', cause: { code: 42 } })

    expect(err3.code).toBe(undefined)
  })
})
