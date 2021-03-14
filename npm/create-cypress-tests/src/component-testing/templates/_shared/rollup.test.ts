import { expect } from 'chai'
import mockFs from 'mock-fs'
import { snapshotPluginsAstCode } from '../../../test-utils'
import { RollupTemplate } from './rollup'

describe('rollup-file install template', () => {
  afterEach(mockFs.restore)

  it('resolves rollup.config.js', () => {
    mockFs({
      '/rollup.config.js': 'module.exports = { }',
    })

    const { success, payload } = RollupTemplate.test(process.cwd())

    expect(success).to.equal(true)
    expect(payload?.rollupConfigPath).to.equal('/rollup.config.js')
  })

  it('finds the closest package.json and tries to fetch rollup config path from scrips', () => {
    mockFs({
      '/configs/rollup.js': 'module.exports = { }',
      '/package.json': JSON.stringify({
        scripts: {
          build: 'rollup --config configs/rollup.js',
        },
      }),
    })

    const { success, payload } = RollupTemplate.test(process.cwd())

    expect(success).to.equal(true)
    expect(payload?.rollupConfigPath).to.equal('/configs/rollup.js')
  })

  it('looks for package.json in the upper folder', () => {
    mockFs({
      '/i/am/in/some/deep/folder/withFile': 'test',
      '/somewhere/configs/rollup.js': 'module.exports = { }',
      '/package.json': JSON.stringify({
        scripts: {
          build: 'rollup --config somewhere/configs/rollup.js',
        },
      }),
    })

    const { success, payload } = RollupTemplate.test('i/am/in/some/deep/folder')

    expect(success).to.equal(true)
    expect(payload?.rollupConfigPath).to.equal('/somewhere/configs/rollup.js')
  })

  it('returns success:false if cannot find rollup config', () => {
    mockFs({
      '/b.js': '2',
      '/a.js': '1',
    })

    const { success, payload } = RollupTemplate.test('/')

    expect(success).to.equal(false)
    expect(payload).to.equal(undefined)
  })

  it('correctly generates plugins config when webpack config path is missing', () => {
    snapshotPluginsAstCode(RollupTemplate)
  })

  it('correctly generates plugins config when webpack config path is provided', () => {
    snapshotPluginsAstCode(RollupTemplate, { rollupConfigPath: '/config/rollup.config.js' })
  })
})
