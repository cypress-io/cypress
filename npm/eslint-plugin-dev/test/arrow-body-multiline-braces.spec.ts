import { describe, it, expect } from 'vitest'
import path from 'path'
import eslint from 'eslint'
import plugin from '../lib'
import _ from 'lodash'

const pluginName = '__plugin__'
const ESLint = eslint.ESLint

async function execute (file, options = {}) {
  const defaultConfig = {
    fix: true,
    ignore: false,
    useEslintrc: false,
    baseConfig: {
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
      },
      rules: {
        [`${pluginName}/arrow-body-multiline-braces`]: ['error', 'always'],
      },
      plugins: [pluginName],
    },
    plugins: {
      [pluginName]: plugin,
    },
  }
  const opts = _.defaultsDeep(options, defaultConfig)

  const cli = new ESLint(opts)

  const results = await cli.lintFiles([path.join(__dirname, file)])

  return results[0]
}

describe('arrow-body-multiline-braces', () => {
  it('lint multiline js', async () => {
    const filename = './fixtures/multiline.js'
    const result = await execute(filename, {
      fix: true,
    })

    expect(result.output).toContain('{')
  })

  it('lint oneline js', async () => {
    const filename = './fixtures/oneline.js'
    const result = await execute(filename, { fix: false })

    expect(result.output).toBeUndefined()
    expect(result.errorCount).toBe(0)
  })
})
