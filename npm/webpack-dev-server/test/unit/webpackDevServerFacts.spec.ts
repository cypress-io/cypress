import { expect } from 'chai'
import { webpackDevServerFacts } from '../../src/webpackDevServerFacts'

describe('webpackDevServerFacts', () => {
  it('should detect v3', () => {
    expect(webpackDevServerFacts.isV3('3.0.0')).equals(true)
    expect(webpackDevServerFacts.isV3('3.1.4')).equals(true)
    expect(webpackDevServerFacts.isV3('4.0.0')).equals(false)
    expect(webpackDevServerFacts.isV3('4.3.0')).equals(false)
  })

  it('should detect v4', () => {
    expect(webpackDevServerFacts.isV4('3.0.0')).equals(false)
    expect(webpackDevServerFacts.isV4('3.1.4')).equals(false)
    expect(webpackDevServerFacts.isV4('3.4.4')).equals(false)
    expect(webpackDevServerFacts.isV4('4.0.0')).equals(true)
    expect(webpackDevServerFacts.isV4('4.3.0')).equals(true)
  })
})
