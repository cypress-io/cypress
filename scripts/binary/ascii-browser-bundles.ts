import fs from 'fs/promises'
import path from 'path'
import { transformSync } from 'esbuild'
import { parse, tokTypes } from 'acorn'
import type { Options, Token } from 'acorn'

// Browsers keep a script with any character above U+00FF as UTF-16, at two bytes per character,
// in both the page's resource cache and V8
const NON_ASCII = /[\u0080-\uffff]/
const NON_ASCII_AFTER_BACKSLASHES = /(\\*)([\u0080-\uffff])/g

const unitEscape = (unit: number) => `\\u${unit.toString(16).toUpperCase().padStart(4, '0')}`

type Range = { start: number, end: number, kind: 'comment' | 'regex' }

const parseOptions = (sourceType: Options['sourceType'], onToken?: (token: Token) => void, onComment?: Options['onComment']): Options => {
  return { ecmaVersion: 'latest', sourceType, allowHashBang: true, onToken, onComment }
}

const describeToken = (token: Token) => {
  return `${token.type.label}:${token.type === tokTypes.regexp ? (token.value as { flags: string }).flags : token.value}`
}

const tokens = (source: string, sourceType: Options['sourceType']) => {
  const found: Token[] = []

  parse(source, parseOptions(sourceType, (token) => found.push(token)))

  return found
}

/**
 * Returns `source` with every character above U+007F written as an escape. esbuild escapes strings,
 * templates and identifiers; comments and regular expression literals are escaped here.
 */
export function toAscii (source: string, { sourceType = 'script', minified = false }: { sourceType?: Options['sourceType'], minified?: boolean } = {}): string {
  const { code } = transformSync(source, { charset: 'ascii', target: 'esnext', legalComments: 'inline', minifyWhitespace: minified })

  if (!NON_ASCII.test(code)) {
    return code
  }

  const ranges: Range[] = []

  parse(code, parseOptions(sourceType, (token) => {
    if (token.type === tokTypes.regexp) {
      ranges.push({ start: token.start, end: token.end, kind: 'regex' })
    }
  }, (block, text, start, end) => {
    ranges.push({ start, end, kind: 'comment' })
  }))

  ranges.sort((a, b) => a.start - b.start)

  let escaped = ''
  let index = 0

  for (const { start, end, kind } of ranges) {
    const text = code.slice(start, end)

    if (!NON_ASCII.test(text)) continue

    escaped += code.slice(index, start)
    escaped += kind === 'comment'
      ? text.replace(NON_ASCII_AFTER_BACKSLASHES, (match, backslashes: string, char: string) => backslashes + unitEscape(char.charCodeAt(0)))
      // A backslash before the character is an identity escape that the \u escape replaces
      : text.replace(NON_ASCII_AFTER_BACKSLASHES, (match, backslashes: string, char: string) => backslashes.slice(backslashes.length % 2) + unitEscape(char.charCodeAt(0)))

    index = end
  }

  escaped += code.slice(index)

  const remaining = escaped.search(NON_ASCII)

  if (remaining !== -1) {
    throw new Error(`a character outside ASCII is still in the bundle: ${JSON.stringify(escaped.slice(Math.max(0, remaining - 60), remaining + 20))}`)
  }

  const before = tokens(code, sourceType).map(describeToken)
  const after = tokens(escaped, sourceType).map(describeToken)
  const changed = before.findIndex((token, i) => token !== after[i])

  if (before.length !== after.length || changed !== -1) {
    throw new Error(`escaping changed the bundle's tokens at token ${changed === -1 ? Math.min(before.length, after.length) : changed}`)
  }

  return escaped
}

const BROWSER_BUNDLES = [
  { dir: 'packages/runner/dist', sourceType: 'script', minified: false },
  { dir: 'packages/app/dist/assets', sourceType: 'module', minified: true },
] as const

/** Rewrites the browser bundles that the runner page loads so every character is ASCII. */
export async function writeBrowserBundlesAsAscii (appDir: string) {
  for (const { dir, sourceType, minified } of BROWSER_BUNDLES) {
    const bundleDir = path.join(appDir, dir)

    for (const name of await fs.readdir(bundleDir)) {
      if (!name.endsWith('.js')) continue

      const file = path.join(bundleDir, name)
      const source = await fs.readFile(file, 'utf8')

      if (!NON_ASCII.test(source)) continue

      try {
        await fs.writeFile(file, toAscii(source, { sourceType, minified }))
      } catch (err) {
        throw new Error(`Could not write ${path.join(dir, name)} as ASCII: ${err.message}`, { cause: err })
      }
    }
  }
}
