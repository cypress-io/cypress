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
  ],
}

export function hasDefaultExport (src: string) {
  const ast = parse(src, babelParserOptions) as bt.File

  if (!ast.tokens?.length) {
    return false
  }

  const tokens = ast.tokens as any[]

  return tokens.find((token, idx) => token.keyword === 'export' && tokens[idx + 1]?.keyword === 'default')
}
