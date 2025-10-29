import { describe, it, expect } from 'vitest'
import path from 'path'
import eslint from 'eslint'
import plugin from '../lib'
import _ from 'lodash'
import { stripIndent } from 'common-tags'

const ruleName = 'no-return-before'
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

describe(ruleName, () => {
  it('pass', async () => {
    const filename = './fixtures/no-return-before-pass.js'
    const result = await execute(filename)

    expect(result.errorCount).toEqual(0)
  })

  it('fail', async () => {
    const filename = './fixtures/no-return-before-fail.js'
    const result = await execute(filename, {
      fix: false,
    })

    expect(result.errorCount).toEqual(4)
    expect(result.messages[0].message).toContain(`after 'describe'`)
  })

  it('fix fail', async () => {
    const filename = './fixtures/no-return-before-fail.js'
    const result = await execute(filename)

    expect(result.output).toEqual(`${stripIndent`
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
      const result = await execute(filename, {
        fix: false,
        baseConfig: {
          rules: {
            [`${pluginName}/${ruleName}`]: [
              'error', {
                tokens: ['someFn'],
              },
            ],
          },
        },
      })

      expect(result.errorCount).toEqual(1)

      expect(result.messages[0].message).toContain('someFn')

      expect(result.output).toBeUndefined()
    })
  })
})
