const path = require('path')
const eslint = require('eslint')
const plugin = require('..')
const _ = require('lodash')
const { expect } = require('chai')

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

    expect(result.errorCount).eq(3)
    expect(result.messages[0].message).to.contain('it')
    expect(result.messages[1].message).to.contain('describe')
    expect(result.messages[2].message).to.contain('context')

    expect(result.output).not.exist
  })
})
