const path = require('path')
const eslint = require('eslint')
const plugin = require('..')
const _ = require('lodash')
const { expect } = require('chai')

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

    expect(result.errorCount).equal(0)
  })

  it('skip test without comment', async () => {
    const filename = './fixtures/skip-comment-fail.js'
    const result = await execute(filename, {
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

      expect(result.errorCount).equal(1)

      expect(result.messages[0].message).to.contain('it')
      expect(result.messages[0].message).to.contain('FOOBAR:')

      expect(result.output).not.exist
    })
  })
})
