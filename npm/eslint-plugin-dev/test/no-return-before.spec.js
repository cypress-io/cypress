const path = require('path')
const CLIEngine = require('eslint').CLIEngine
const plugin = require('..')
const _ = require('lodash')
const { stripIndent } = require('common-tags')
const { expect } = require('chai')

const ruleName = 'no-return-before'
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

describe(ruleName, () => {
  it('pass', async () => {
    const filename = './fixtures/no-return-before-pass.js'
    const result = execute(filename)

    expect(result.errorCount).equal(0)
  })

  it('fail', async () => {
    const filename = './fixtures/no-return-before-fail.js'
    const result = execute(filename, {
      fix: false,
    })

    expect(result.errorCount).equal(4)
    expect(result.messages[0].message).to.contain(`after 'describe'`)
  })

  it('fix fail', async () => {
    const filename = './fixtures/no-return-before-fail.js'
    const result = execute(filename)

    expect(result.output).equal(`${stripIndent`
    describe('outer', ()=>{
      describe('some test', ()=>{
        context('some test', ()=>{
          it('some test', ()=>{
            expect('foo').to.eq('bar')
          })
          return someFn()
        })
      })
    })
    `}\n`)
  })

  describe('config', () => {
    it('config [tokens]', async () => {
      const filename = './fixtures/no-return-before-fail.js'
      const result = execute(filename, {
        fix: false,
        rules: {
          [`${pluginName}/${ruleName}`]: [
            'error', {
              tokens: ['someFn'],
            },
          ],
        },
      })

      expect(result.errorCount).equal(1)

      expect(result.messages[0].message).to.contain('someFn')

      expect(result.output).not.not.exist
    })
  })
})
