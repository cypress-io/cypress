import { expect } from 'chai'
import mockFs from 'mock-fs'
import { snapshotPluginsAstCode } from '../../../test-utils'
import { VueCliTemplate } from './vueCli'

describe('vue webpack-file install template', () => {
  beforeEach(mockFs.restore)

  it('resolves webpack.config.js', () => {
    mockFs({
      '/package.json': JSON.stringify({
        'devDependencies': {
          '@vue/cli-plugin-babel': '~4.5.0',
          '@vue/cli-plugin-eslint': '~4.5.0',
          '@vue/cli-plugin-router': '~4.5.0',
          '@vue/cli-service': '~4.5.0',
        },
      }),
    })

    const { success } = VueCliTemplate.test('/')

    expect(success).to.equal(true)
  })

  it('returns success:false if vue-cli-service is not installed', () => {
    mockFs({
      '/package.json': JSON.stringify({
        'devDependencies': {
          'webpack': '*',
          'vue': '2.x',
        },
      }),
    })

    const { success } = VueCliTemplate.test('/')

    expect(success).to.equal(false)
  })

  it('correctly generates plugins for vue-cli-service', () => {
    snapshotPluginsAstCode(VueCliTemplate)
  })
})
