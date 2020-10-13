import { mockFs, clearMockedFs } from '../test/mockFs'
import { BabelTemplate } from './babel'

describe('babel installation template', () => {
  beforeEach(clearMockedFs)

  it('resolves babel.config.json', () => {
    mockFs({
      'babel.config.json': JSON.stringify({
        presets: [],
        plugins: [],
      }),
    })

    const { success } = BabelTemplate.test('/')
    expect(success).toBe(true)
  })

  it('resolves babel.config.js', () => {
    mockFs({
      'project/babel.config.js':
        'module.exports = { presets: [], plugins: [] };',
      'project/index/package.json': 'dev/null',
    })

    const { success } = BabelTemplate.test('/project/index')
    expect(success).toBe(true)
  })

  it('resolves babel config from the deep folder', () => {
    mockFs({
      'some/.babelrc': JSON.stringify({
        presets: [],
        plugins: [],
      }),
      'some/deep/folder/text.txt': '1',
    })

    const { success } = BabelTemplate.test('/some/deep/folder')
    expect(success).toBe(true)
  })

  it('fails if no babel config found', () => {
    mockFs({
      'some.txt': '1',
    })

    const { success } = BabelTemplate.test('/')
    expect(success).toBe(false)
  })

  it('resolves babel.config from package.json', () => {
    mockFs({
      'package.json': JSON.stringify({
        babel: {
          presets: [],
        },
      }),
    })

    const { success } = BabelTemplate.test('/')
    expect(success).toBe(true)
  })
})
