import { expect } from 'chai'
import EventEmitter from 'events'
import snapshot from 'snap-shot-it'
import { makeDefaultWebpackConfig } from '../src/makeDefaultWebpackConfig'

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
