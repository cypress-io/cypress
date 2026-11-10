import { sortBrowsersByDeprecation } from './sortBrowsersByDeprecation'

const browser = (displayName: string, overrides: Partial<{ disabled: boolean | null, isVersionSupported: boolean, isDeprecated: boolean }> = {}) => {
  return {
    displayName,
    disabled: false,
    isVersionSupported: true,
    isDeprecated: false,
    ...overrides,
  }
}

const names = (browsers: { displayName: string }[]) => browsers.map((b) => b.displayName)

describe('sortBrowsersByDeprecation', () => {
  it('sorts supported, non-deprecated browsers alphabetically', () => {
    const result = sortBrowsersByDeprecation([browser('Firefox'), browser('Chrome'), browser('Edge')])

    expect(names(result)).to.deep.equal(['Chrome', 'Edge', 'Firefox'])
  })

  it('sorts deprecated browsers after supported, non-deprecated browsers', () => {
    const result = sortBrowsersByDeprecation([browser('Electron', { isDeprecated: true }), browser('Chrome'), browser('Firefox')])

    expect(names(result)).to.deep.equal(['Chrome', 'Firefox', 'Electron'])
  })

  it('always sorts disabled/unsupported browsers last, even when deprecated', () => {
    const result = sortBrowsersByDeprecation([
      browser('WebKit', { disabled: true }),
      browser('Electron', { isDeprecated: true }),
      browser('Chrome'),
      browser('Old', { isVersionSupported: false, isDeprecated: true }),
    ])

    // tier 0 (Chrome) → tier 1 (Electron) → tier 2 (Old, WebKit alphabetical)
    expect(names(result)).to.deep.equal(['Chrome', 'Electron', 'Old', 'WebKit'])
  })

  it('does not mutate the input array', () => {
    const input = [browser('Firefox'), browser('Chrome')]

    sortBrowsersByDeprecation(input)

    expect(names(input)).to.deep.equal(['Firefox', 'Chrome'])
  })
})
