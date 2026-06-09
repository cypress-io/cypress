import { allBrowsersIcons, getBrowserIcon } from './browserLogos'

describe('getBrowserIcon', () => {
  it('resolves known browsers by display name', () => {
    expect(getBrowserIcon('Chrome')).to.equal(allBrowsersIcons.chrome)
    expect(getBrowserIcon('Edge')).to.equal(allBrowsersIcons.edge)
    expect(getBrowserIcon('Firefox')).to.equal(allBrowsersIcons.firefox)
    expect(getBrowserIcon('Electron')).to.equal(allBrowsersIcons.electron)
  })

  it('is case-insensitive', () => {
    expect(getBrowserIcon('CHROME')).to.equal(allBrowsersIcons.chrome)
  })

  // Browsers detected from an explicit binary path get a "Custom " display name
  // prefix and must still resolve to the correct icon.
  // @see https://github.com/cypress-io/cypress/issues/32924
  it('resolves custom browsers to their base icon', () => {
    expect(getBrowserIcon('Custom Chrome')).to.equal(allBrowsersIcons.chrome)
    expect(getBrowserIcon('Custom Edge')).to.equal(allBrowsersIcons.edge)
    expect(getBrowserIcon('Custom Firefox')).to.equal(allBrowsersIcons.firefox)
    expect(getBrowserIcon('Custom Chrome for Testing')).to.equal(allBrowsersIcons['chrome for testing'])
    expect(getBrowserIcon('Custom Chromium')).to.equal(allBrowsersIcons.chromium)
  })

  it('falls back to the generic icon for unknown or empty values', () => {
    expect(getBrowserIcon('Some Unknown Browser')).to.equal(allBrowsersIcons.generic)
    expect(getBrowserIcon('')).to.equal(allBrowsersIcons.generic)
    expect(getBrowserIcon(undefined)).to.equal(allBrowsersIcons.generic)
    expect(getBrowserIcon(null)).to.equal(allBrowsersIcons.generic)
  })
})
