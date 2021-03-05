import * as babel from '@babel/core'
import { expect } from 'chai'
import { createSupportBabelPlugin, createTransformPluginsFileBabelPlugin } from './babelTransform'

describe('babel transform utils', () => {
  context('support babel template', () => {
    it('injects import after the last import in the file', () => {
      const plugin = createSupportBabelPlugin('import "@cypress/react"')

      const output = babel.transformSync([
        'import "./commands.js"',
      ].join('\n'), {
        plugins: [plugin],
      })?.code

      expect(output).to.equal([
        'import "./commands.js";',
        'import "@cypress/react";',
      ].join('\n'))
    })

    it('injects import after the last import if a lot of imports and code inside', () => {
      const plugin = createSupportBabelPlugin('import "@cypress/react"')

      const output = babel.transformSync([
        'import "./commands.js";',
        'import "./commands4.js";',
        'import "./commands3.js";',
        'import "./commands2.js";',
        '',
        'function hello() {',
        '  console.log("world");',
        '}',
      ].join('\n'), {
        plugins: [plugin],
      })?.code

      expect(output).to.equal([
        'import "./commands.js";',
        'import "./commands4.js";',
        'import "./commands3.js";',
        'import "./commands2.js";',
        'import "@cypress/react";',
        '',
        'function hello() {',
        '  console.log("world");',
        '}',
      ].join('\n'))
    })

    it('adds import as 1st line if no imports or require found', () => {
      const plugin = createSupportBabelPlugin('import "@cypress/react"')

      const output = babel.transformSync('', { plugins: [plugin] })?.code

      expect(output).to.equal('import "@cypress/react";')
    })
  })

  context('Plugins config babel plugin', () => {
    it('injects code into the plugins file based on ast', () => {
      const plugin = createTransformPluginsFileBabelPlugin({
        Require: babel.template.ast('require("something")'),
        ModuleExportsBody: babel.template.ast('yey()'),
      })

      const output = babel.transformSync([
        'module.exports = (on, config) => {',
        'on("do")',
        '}',
      ].join('\n'), {
        plugins: [plugin],
      })?.code

      expect(output).to.equal([
        'require("something");',
        '',
        'module.exports = (on, config) => {',
        '  on("do");',
        '  yey();',
        '};',
      ].join(`\n`))
    })
  })
})
