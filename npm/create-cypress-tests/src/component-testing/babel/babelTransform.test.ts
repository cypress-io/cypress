import * as babel from '@babel/core'
import { expect } from 'chai'
import { createTransformPluginsFileBabelPlugin } from './babelTransform'

describe('babel transform utils', () => {
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
