import '../../../spec_helper'
import { parseHashFromBundleUrl } from '../../../../lib/cloud/bundles/parse_hash_from_bundle_url'

describe('parseHashFromBundleUrl', () => {
  it('returns the hash portion of a typical bundle url', () => {
    expect(parseHashFromBundleUrl('https://cdn.cypress.io/cy-prompt/abc123def456.tar')).to.equal('abc123def456')
  })

  it('strips multiple extension segments', () => {
    expect(parseHashFromBundleUrl('https://cdn.cypress.io/studio/abc123.tar.gz')).to.equal('abc123')
  })

  it('handles a url without an extension', () => {
    expect(parseHashFromBundleUrl('https://cdn.cypress.io/cy-prompt/abc123')).to.equal('abc123')
  })

  it('throws when the url has no path segment', () => {
    expect(() => parseHashFromBundleUrl('https://cdn.cypress.io/')).to.throw(/Unable to parse bundle hash/)
  })

  it('throws when the url is empty', () => {
    expect(() => parseHashFromBundleUrl('')).to.throw(/Unable to parse bundle hash/)
  })
})
