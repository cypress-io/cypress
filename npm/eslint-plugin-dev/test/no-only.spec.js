const path = require('path')
const CLIEngine = require('eslint').CLIEngine
const plugin = require('..')
const _ = require('lodash')
const { expect } = require('chai')

const ruleName = 'no-only'
const pluginName = '__plugin__'

function execute (file, options = {}) {
  const opts = _.defaultsDeep(options, {
    fix: true,
    config: {
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
      },
    },
  })

  const cli = new CLIEngine({
    parserOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
    },
    rules: {
      [`${pluginName}/${ruleName}`]: ['error'],
    },
    ...opts,
    ignore: false,
    useEslintrc: false,
    plugins: [pluginName],
  })

  cli.addPlugin(pluginName, plugin)
  const results = cli.executeOnFiles([path.join(__dirname, file)]).results[0]

  return results
}

describe('no-only', () => {
  it('lint js with only', async () => {
    const filename = './fixtures/with-only.js'
    const result = execute(filename, {
      fix: true,
    })

    expect(result.errorCount).eq(3)
    expect(result.messages[0].message).to.contain('it')
    expect(result.messages[1].message).to.contain('describe')
    expect(result.messages[2].message).to.contain('context')

    expect(result.output).not.exist
  })
})
