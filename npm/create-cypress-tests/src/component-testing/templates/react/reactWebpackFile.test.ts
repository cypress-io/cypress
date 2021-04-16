import { expect } from 'chai'
import mockFs from 'mock-fs'
import { snapshotPluginsAstCode } from '../../../test-utils'
import { WebpackTemplate } from './reactWebpackFile'

describe('webpack-file install template', () => {
  afterEach(mockFs.restore)

  it('resolves webpack.config.js', () => {
    mockFs({
      '/webpack.config.js': 'module.exports = { }',
    })

    const { success, payload } = WebpackTemplate.test(process.cwd())

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

    const { success, payload } = WebpackTemplate.test(process.cwd())

    expect(success).to.equal(true)
    expect(payload?.webpackConfigPath).to.equal('/configs/webpack.js')
  })

  it('looks for package.json in the upper folder', () => {
    mockFs({
      '/i/am/in/some/deep/folder/withFile': 'test',
      '/somewhere/configs/webpack.js': 'module.exports = { }',
      '/package.json': JSON.stringify({
        scripts: {
          build: 'webpack --config somewhere/configs/webpack.js',
        },
      }),
    })

    const { success, payload } = WebpackTemplate.test(
      'i/am/in/some/deep/folder',
    )

    expect(success).to.equal(true)
    expect(payload?.webpackConfigPath).to.equal('/somewhere/configs/webpack.js')
  })

  it('returns success:false if cannot find webpack config', () => {
    mockFs({
      '/a.js': '1',
      '/b.js': '2',
    })

    const { success, payload } = WebpackTemplate.test('/')

    expect(success).to.equal(false)
    expect(payload).to.equal(undefined)
  })

  it('correctly generates plugins config when webpack config path is missing', () => {
    snapshotPluginsAstCode(WebpackTemplate)
  })

  it('correctly generates plugins config when webpack config path is provided', () => {
    snapshotPluginsAstCode(WebpackTemplate, { webpackConfigPath: '/config/webpack.config.js' })
  })
})
