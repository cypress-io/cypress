import { expect } from 'chai'
import EventEmitter from 'events'
import snapshot from 'snap-shot-it'
import { makeWebpackConfig } from '../../src/makeWebpackConfig'

describe('makeWebpackConfig', () => {
  it('ignores userland webpack `output.publicPath`', async () => {
    const actual = await makeWebpackConfig({
      output: {
        publicPath: '/this-will-be-ignored',
      },
    }, {
      devServerEvents: new EventEmitter(),
      devServerPublicPathRoute: '/test-public-path',
      isOpenMode: true,
      supportFile: '/support.js',
      projectRoot: '.',
      files: [],
      indexHtmlFile: 'index.html',
    })

    // plugins contain circular deps which cannot be serialized in a snapshot.
    // instead just compare the name and order of the plugins.
    // @ts-expect-error
    actual.plugins = actual.plugins.map((p) => p.constructor.name)

    // these will include paths from the user's local file system, so we should not include them the snapshot
    delete actual.output.path
    delete actual.entry

    expect(actual.output.publicPath).to.eq('/test-public-path/')
    snapshot(actual)
  })
})
