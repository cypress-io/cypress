import { mockFs, clearMockedFs } from '../test/mockFs'
import { RollupTemplate } from './rollup'

describe('rollup-file install template', () => {
  afterEach(clearMockedFs)

  it('suggests the right code', () => {
    expect(
      RollupTemplate.getPluginsCode(
        {
          rollupConfigPath: '/configs/rollup.config.js',
        },
        { cypressProjectRoot: '/' },
      ),
    ).toContain("configFile: 'configs/rollup.config.js'")
  })

  it('resolves rollup.config.js', () => {
    mockFs({
      'rollup.config.js': 'module.exports = { }',
    })

    const { success, payload } = RollupTemplate.test(process.cwd())
    expect(success).toBe(true)
    expect(payload?.rollupConfigPath).toBe('/rollup.config.js')
  })

  it('finds the closest package.json and tries to fetch rollup config path from scrips', () => {
    mockFs({
      'configs/rollup.js': 'module.exports = { }',
      'package.json': JSON.stringify({
        scripts: {
          build: 'rollup --config configs/rollup.js',
        },
      }),
    })

    const { success, payload } = RollupTemplate.test(process.cwd())

    expect(success).toBe(true)
    expect(payload?.rollupConfigPath).toBe('/configs/rollup.js')
  })

  it('looks for package.json in the upper folder', () => {
    mockFs({
      'i/am/in/some/deep/folder/withFile': 'test',
      'somewhere/configs/rollup.js': 'module.exports = { }',
      'package.json': JSON.stringify({
        scripts: {
          build: 'rollup --config somewhere/configs/rollup.js',
        },
      }),
    })

    const { success, payload } = RollupTemplate.test('i/am/in/some/deep/folder')

    expect(success).toBe(true)
    expect(payload?.rollupConfigPath).toBe('/somewhere/configs/rollup.js')
  })

  it('returns success:false if cannot find rollup config', () => {
    mockFs({
      'a.js': '1',
      'b.js': '2',
    })

    const { success, payload } = RollupTemplate.test('/')
    expect(success).toBe(false)
    expect(payload).toBe(undefined)
  })
})
