import { expect } from 'chai'
import snapshot from 'snap-shot-it'
import { makeWebpackConfig } from '../../src/makeWebpackConfig'

describe('makeWebpackConfig', () => {
  it('ignores userland webpack `output.publicPath`', async () => {
    const actual = await makeWebpackConfig({
      output: {
        publicPath: '/this-will-be-ignored',
      },
    }, {
      devServerPublicPathRoute: '/test-public-path',
      isOpenMode: true,
      supportFile: '/support.js',
      projectRoot: '.',
      files: [],
    })

    // plugins contain circular deps which cannot be serialized in a snapshot.
    // instead just compare the name and order of the plugins.
    // @ts-expect-error
    actual.plugins = actual.plugins.map((p) => p.constructor.name)
    expect(actual.output.publicPath).to.eq('/test-public-path/')
    snapshot(actual)
  })
})
