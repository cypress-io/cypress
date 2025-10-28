import { describe, it, expect } from 'vitest'
import path from 'path'
import eslint from 'eslint'
import plugin from '../lib'
import _ from 'lodash'

const ruleName = 'no-only'
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
        [`${pluginName}/${ruleName}`]: ['error'],
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

describe('no-only', () => {
  it('lint js with only', async () => {
    const filename = './fixtures/with-only.js'
    const result = await execute(filename, {
      fix: true,
    })

    expect(result.errorCount).toEqual(3)
    expect(result.messages[0].message).toContain('it')
    expect(result.messages[1].message).toContain('describe')
    expect(result.messages[2].message).toContain('context')

    expect(result.output).toBeUndefined()
  })
})
