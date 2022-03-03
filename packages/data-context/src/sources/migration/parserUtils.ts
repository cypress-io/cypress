import { parse, ParserOptions } from '@babel/parser'
import { visit } from 'recast'
import type * as bt from '@babel/types'

const babelParserOptions: ParserOptions = {
  sourceType: 'module',
  strictMode: false,
  tokens: true,
  plugins: [
    'decorators-legacy',
    'doExpressions',
    'objectRestSpread',
    'classProperties',
    'classPrivateProperties',
    'classPrivateMethods',
    'exportDefaultFrom',
    'exportNamespaceFrom',
    'asyncGenerators',
    'functionBind',
    'functionSent',
    'dynamicImport',
    'numericSeparator',
    'optionalChaining',
    'importMeta',
    'bigInt',
    'optionalCatchBinding',
    'throwExpressions',
    'nullishCoalescingOperator',
    'typescript',
  ],
}

export function hasDefaultExport (src: string): boolean {
  const ast = parse(src, babelParserOptions) as bt.File

  let hasDefault = false

  visit(ast, {
    visitExportDefaultDeclaration () {
      hasDefault = true

      return false
    },
  })

  return hasDefault
}
