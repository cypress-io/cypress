import { makeDefaultWebpackConfig } from '../src/plugin/makeDefaultWebpackConfig'

describe('makeDefaultWebpackConfig', () => {
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
