import * as babel from '@babel/core'
import { expect } from 'chai'
import { createTransformPluginsFileBabelPlugin } from './babelTransform'

describe('babel transform utils', () => {
  context('Plugins config babel plugin', () => {
    it('injects code into the plugins file based on ast', () => {
      const plugin = createTransformPluginsFileBabelPlugin({
        RequireAst: babel.template.ast('require("something")'),
        IfComponentTestingPluginsAst: babel.template.ast('yey()'),
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
        '',
        '  if (config.testingType === "component") {',
        '    yey();',
        '  }',
        '};',
      ].join(`\n`))
    })
  })
})
