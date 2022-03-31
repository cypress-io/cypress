import { makeDefaultWebpackConfig } from '../src/makeDefaultWebpackConfig'

describe.skip('makeDefaultWebpackConfig', () => {
  it('creates the default (base) webpack config', () => {
    makeDefaultWebpackConfig({
      devServerConfig: {},
    })
  })

  it.skip('uses the indexHtmlFile if passed', () => {
    makeDefaultWebpackConfig({
      devServerConfig: {},
    })
  })
})
