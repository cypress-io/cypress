import { describe, it, expect } from 'vitest'
import path from 'path'
import eslint from 'eslint'
import plugin from '../lib'

function defaultsDeep (target, ...sources) {
  for (const source of sources) {
    for (const key of Object.keys(source)) {
      if (target[key] === undefined) {
        target[key] = source[key]
      } else if (
        typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key]) &&
        typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])
      ) {
        defaultsDeep(target[key], source[key])
      }
    }
  }

  return target
}

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
  const opts = defaultsDeep(options, defaultConfig)

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
