import { chromeLikeVersionRegex } from '../../lib/browsers'
import { parseVersion } from '../../lib/detect'

describe('chromeLikeVersionRegex', () => {
  it('is a regular expression', () => {
    expect(chromeLikeVersionRegex).to.be.a('regexp')
  })

  it('works with Chrome version', () => {
    const version = parseVersion(chromeLikeVersionRegex, 'Google Chrome 62.0.3202.94')
    expect(version).to.deep.equal({
      version: '62.0.3202.94',
      majorVersion: '62'
    })
  })

  it('works with Chromium version', () => {
    const version = parseVersion(chromeLikeVersionRegex, 'Chromium 60.0.3110.0')
    expect(version).to.deep.equal({
      version: '60.0.3110.0',
      majorVersion: '60'
    })
  })

  it('works with Chrome Canary version', () => {
    const version = parseVersion(chromeLikeVersionRegex, 'Google Chrome 65.0.3287.0 canary')
    expect(version).to.deep.equal({
      version: '65.0.3287.0',
      majorVersion: '65'
    })
  })

  it('works with fake browser version', () => {
    const version = parseVersion(chromeLikeVersionRegex, 'Chrome 999')
    expect(version).to.deep.equal({
      version: '999',
      majorVersion: '999'
    })
  })
})
