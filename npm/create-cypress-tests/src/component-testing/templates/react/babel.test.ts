import { expect } from 'chai'
import mockFs from 'mock-fs'
import * as babel from '@babel/core'
import { BabelTemplate } from './babel'
import { createTransformPluginsFileBabelPlugin } from '../../babel/babelTransform'

describe('babel installation template', () => {
  beforeEach(mockFs.restore)

  it('resolves babel.config.json', () => {
    mockFs({
      '/babel.config.json': JSON.stringify({
        presets: [],
        plugins: [],
      }),
    })

    const { success } = BabelTemplate.test('/')

    expect(success).to.equal(true)
  })

  it('resolves babel.config.js', () => {
    mockFs({
      '/project/babel.config.js':
        'module.exports = { presets: [], plugins: [] };',
      '/project/index/package.json': 'dev/null',
    })

    const { success } = BabelTemplate.test('/project/index')

    expect(success).to.equal(true)
  })

  it('resolves babel config from the deep folder', () => {
    mockFs({
      '/some/.babelrc': JSON.stringify({
        presets: [],
        plugins: [],
      }),
      '/some/deep/folder/text.txt': '1',
    })

    const { success } = BabelTemplate.test('/some/deep/folder')

    expect(success).to.equal(true)
  })

  it('fails if no babel config found', () => {
    mockFs({
      '/some.txt': '1',
    })

    const { success } = BabelTemplate.test('/')

    expect(success).to.equal(false)
  })

  it('resolves babel.config from package.json', () => {
    mockFs({
      '/package.json': JSON.stringify({
        babel: {
          presets: [],
        },
      }),
    })

    const { success } = BabelTemplate.test('/')

    expect(success).to.equal(true)
  })

  it('automatically injects config to the code', () => {
    const code = [
      'const something = require("something")',
      'module.exports = (on) => {',
      '};',
    ].join('\n')

    const output = babel.transformSync(code, {
      plugins: [createTransformPluginsFileBabelPlugin(BabelTemplate.getPluginsCodeAst!())],
    })

    console.log('OUTPUT\n', output?.code)
  })
})
