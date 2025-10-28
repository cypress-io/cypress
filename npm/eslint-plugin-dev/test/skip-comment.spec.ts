import { describe, it, expect } from 'vitest'

import path from 'path'
import eslint from 'eslint'
import _ from 'lodash'

const plugin = require('../lib')

const ruleName = 'skip-comment'
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

describe('skip-comment', () => {
  it('skip test with comment', async () => {
    const filename = './fixtures/skip-comment-pass.js'
    const result = await execute(filename, {
      fix: true,
    })

    expect(result.errorCount).toEqual(0)
  })

  it('skip test without comment', async () => {
    const filename = './fixtures/skip-comment-fail.js'
    const result = await execute(filename, {
      fix: true,
    })

    expect(result.errorCount).toEqual(3)

    expect(result.messages[0].message).toContain('it')
    expect(result.messages[0].message).toContain('NOTE:')
    expect(result.messages[0].message).toContain('TODO:')
    expect(result.messages[1].message).toContain('describe')
    expect(result.messages[1].message).toContain('NOTE:')
    expect(result.messages[2].message).toContain('context')
    expect(result.messages[2].message).toContain('NOTE:')

    expect(result.output).toBeUndefined()
  })

  describe('config', () => {
    it('skip test without comment', async () => {
      const filename = './fixtures/skip-comment-config.js'
      const result = await execute(filename, {
        fix: true,
        baseConfig: {
          rules: {
            [`${pluginName}/${ruleName}`]: [
              'error', {
                commentTokens: ['FOOBAR:'],
              },
            ],
          },
        },
      })

      expect(result.errorCount).toEqual(1)

      expect(result.messages[0].message).toContain('it')
      expect(result.messages[0].message).toContain('FOOBAR:')

      expect(result.output).toBeUndefined()
    })
  })
})
