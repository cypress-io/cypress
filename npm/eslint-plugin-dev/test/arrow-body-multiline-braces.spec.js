const path = require('path')
const eslint = require('eslint')
const plugin = require('../lib')
const _ = require('lodash')
const { expect } = require('chai')

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

    expect(result.output).to.contain('{')
  })

  it('lint oneline js', async () => {
    const filename = './fixtures/oneline.js'
    const result = await execute(filename, { fix: false })

    expect(result.output).not.ok
    expect(result.errorCount).eq(0)
  })
})
