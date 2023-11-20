const path = require('path')
const CLIEngine = require('eslint').CLIEngine
const plugin = require('..')
const _ = require('lodash')
const { expect } = require('chai')

const ruleName = 'skip-comment'
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

describe('skip-comment', () => {
  it('skip test with comment', async () => {
    const filename = './fixtures/skip-comment-pass.js'
    const result = execute(filename, {
      fix: true,
    })

    expect(result.errorCount).equal(0)
  })

  it('skip test without comment', async () => {
    const filename = './fixtures/skip-comment-fail.js'
    const result = execute(filename, {
      fix: true,
    })

    expect(result.errorCount).equal(3)

    expect(result.messages[0].message).to.contain('it')
    expect(result.messages[0].message).to.contain('NOTE:')
    expect(result.messages[0].message).to.contain('TODO:')
    expect(result.messages[1].message).to.contain('describe')
    expect(result.messages[1].message).to.contain('NOTE:')
    expect(result.messages[2].message).to.contain('context')
    expect(result.messages[2].message).to.contain('NOTE:')

    expect(result.output).not.not.exist
  })

  describe('config', () => {
    it('skip test without comment', async () => {
      const filename = './fixtures/skip-comment-config.js'
      const result = execute(filename, {
        fix: true,
        rules: {
          [`${pluginName}/${ruleName}`]: [
            'error', {
              commentTokens: ['FOOBAR:'],
            },
          ],
        },
      })

      expect(result.errorCount).equal(1)

      expect(result.messages[0].message).to.contain('it')
      expect(result.messages[0].message).to.contain('FOOBAR:')

      expect(result.output).not.exist
    })
  })
})
