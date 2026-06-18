import { describe, it, expect } from 'vitest'
import type { DocumentRewriteConfig, RegisterDefaultInterceptMiddlewareConfig } from '../../lib'

describe('DocumentRewriteConfig', () => {
  it('is included in RegisterDefaultInterceptMiddlewareConfig for composition-root typing', () => {
    const config: RegisterDefaultInterceptMiddlewareConfig = {
      modifyObstructiveCode: true,
      experimentalModifyObstructiveThirdPartyCode: false,
      blockHosts: null,
      experimentalCspAllowList: false,
    }

    const rewriteOnly: DocumentRewriteConfig = config

    expect(rewriteOnly.modifyObstructiveCode).toBe(true)
    expect(rewriteOnly.experimentalModifyObstructiveThirdPartyCode).toBe(false)
  })
})
