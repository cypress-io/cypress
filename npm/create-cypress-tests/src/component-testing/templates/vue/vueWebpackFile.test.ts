import { expect } from 'chai'
import mockFs from 'mock-fs'
import { snapshotPluginsAstCode } from '../../../test-utils'
import { VueWebpackTemplate } from './vueWebpackFile'

describe('vue webpack-file install template', () => {
  beforeEach(mockFs.restore)

  it('resolves webpack.config.js', () => {
    mockFs({
      '/webpack.config.js': 'module.exports = { }',
    })

    const { success, payload } = VueWebpackTemplate.test(process.cwd())

    expect(success).to.equal(true)
    expect(payload?.webpackConfigPath).to.equal('/webpack.config.js')
  })

  it('finds the closest package.json and tries to fetch webpack config path from scrips', () => {
    mockFs({
      '/configs/webpack.js': 'module.exports = { }',
      '/package.json': JSON.stringify({
        scripts: {
          build: 'webpack --config configs/webpack.js',
        },
      }),
    })

    const { success, payload } = VueWebpackTemplate.test(process.cwd())

    expect(success).to.equal(true)
    expect(payload?.webpackConfigPath).to.equal('/configs/webpack.js')
  })

  it('looks for package.json in the upper folder', () => {
    mockFs({
      '/some/deep/folder/withFile': 'test',
      '/somewhere/configs/webpack.js': 'module.exports = { }',
      '/package.json': JSON.stringify({
        scripts: {
          build: 'webpack --config somewhere/configs/webpack.js',
        },
      }),
    })

    const { success, payload } = VueWebpackTemplate.test(
      '/some/deep/folder',
    )

    expect(success).to.equal(true)
    expect(payload?.webpackConfigPath).to.equal('/somewhere/configs/webpack.js')
  })

  it('returns success:false if cannot find webpack config', () => {
    mockFs({
      '/a.js': '1',
      '/b.js': '2',
    })

    const { success, payload } = VueWebpackTemplate.test('/')

    expect(success).to.equal(false)
    expect(payload).to.equal(undefined)
  })

  it('correctly generates plugins config when webpack config path is missing', () => {
    snapshotPluginsAstCode(VueWebpackTemplate)
  })

  it('correctly generates plugins config when webpack config path is provided', () => {
    snapshotPluginsAstCode(VueWebpackTemplate, { webpackConfigPath: '/build/webpack.config.js' })
  })
})
