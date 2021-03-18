import * as babel from '@babel/core'
import snapshot from 'snap-shot-it'
import mockFs from 'mock-fs'
import { SinonSpyCallApi } from 'sinon'
import { createTransformPluginsFileBabelPlugin } from './component-testing/babel/babelTransform'
import { Template } from './component-testing/templates/Template'

export function someOfSpyCallsIncludes (spy: any, logPart: string) {
  return spy.getCalls().some(
    (spy: SinonSpyCallApi<unknown[]>) => {
      return spy.args.some((callArg) => typeof callArg === 'string' && callArg.includes(logPart))
    },
  )
}

export function snapshotPluginsAstCode<T> (template: Template<T>, payload?: T) {
  mockFs.restore()
  const code = [
    'const something = require("something")',
    'module.exports = (on) => {',
    '};',
  ].join('\n')

  const babelPlugin = createTransformPluginsFileBabelPlugin(template.getPluginsCodeAst(payload ?? null, { cypressProjectRoot: '/' }))
  const output = babel.transformSync(code, {
    plugins: [babelPlugin],
  })

  if (!output || !output.code) {
    throw new Error('Babel transform output is empty.')
  }

  snapshot(output.code)
}
