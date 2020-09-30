const path = require('path')
const CLIEngine = require('eslint').CLIEngine
const plugin = require('..')
const _ = require('lodash')

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
      [`${pluginName}/arrow-body-multiline-braces`]: ['error', 'always'],
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

describe('arrow-body-multiline-braces', () => {
  it('lint multiline js', async () => {
    const filename = './fixtures/multiline.js'
    const result = execute(filename, {
      fix: true,
    })

    expect(result.output).toContain('{')
  })

  it('lint oneline js', async () => {
    const filename = './fixtures/oneline.js'
    const result = execute(filename, { fix: false })

    expect(result.output).not.ok
    expect(result).toHaveProperty('errorCount', 0)
  })
})
