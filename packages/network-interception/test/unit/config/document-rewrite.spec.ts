import { describe, it, expect } from 'vitest'
import type { DocumentRewriteConfig } from '../../lib'

describe('DocumentRewriteConfig', () => {
  it('is distinct from HttpIntercept stack config fields', () => {
    const config: DocumentRewriteConfig = {
      modifyObstructiveCode: true,
      experimentalModifyObstructiveThirdPartyCode: false,
    }

    expect(config.modifyObstructiveCode).toBe(true)
    expect(config.experimentalModifyObstructiveThirdPartyCode).toBe(false)
  })
})
