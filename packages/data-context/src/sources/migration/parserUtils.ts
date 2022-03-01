import { parse, ParserOptions } from '@babel/parser'
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

  if (!ast.tokens?.length) {
    return false
  }

  const tokens = ast.tokens as any[]

  const defaultExport = !!(tokens.find((token, idx) => {
    const isExport = token.type?.keyword === 'export'
    const next = tokens[idx + 1]?.type?.keyword === 'default'

    return Boolean(isExport && next)
  }))

  return Boolean(defaultExport)
}
