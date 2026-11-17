import { createHash } from 'crypto'
import { parse, tokTypes } from 'acorn'
import type { Options, Token } from 'acorn'

const NON_LATIN1 = /[^\0-\xff]/
const BACKSLASHES_THEN_NON_LATIN1 = /(\\*)([^\0-\xff])/g
const LINE_SEPARATORS = /[\u2028\u2029]/
const SURROGATE = /[\ud800-\udfff]/
const HIGH_SURROGATE = /[\ud800-\udbff]/
const LINE_TERMINATOR = /[\n\r\u2028\u2029]/
// A `\uXXXX` escape or a char above U+00FF, each after any backslashes
const REGEX_CHAR = /(\\*)(?:\\u([0-9a-fA-F]{4})|([^\0-\xff]))/g
// The non-Latin-1 code points of the ECMAScript WhiteSpace production
const WHITESPACE = /[\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/

const PARSE_OPTIONS: Options = {
  ecmaVersion: 'latest',
  sourceType: 'script',
  allowHashBang: true,
  allowReturnOutsideFunction: true,
}

type Range = { start: number, end: number }
type Node = Range & { type: string }
type Context = 'string' | 'regex' | 'template' | 'tagged-template' | 'identifier'

/** `delta` code units added at `index` of the original source, or with `lineBreak` the terminator at `index` became `\n` */
export type Edit = { index: number, delta: number, lineBreak?: true }

function unicodeEscape (char: string) {
  return `\\u${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`
}

function codePointEscape (source: string, index: number) {
  return `\\u{${(source.codePointAt(index) ?? 0).toString(16).toUpperCase()}}`
}

function describeLocation (source: string, index: number) {
  const before = source.slice(0, index)
  const line = before.split('\n').length
  const column = index - before.lastIndexOf('\n')
  const excerpt = source.slice(Math.max(0, index - 40), index + 40).replace(/\n/g, '\\n')

  return `line ${line}, column ${column}: ${excerpt}`
}

/** Index of the first element of the ascending `values` that is >= `target`. */
function lowerBound (values: number[], target: number) {
  let low = 0
  let high = values.length

  while (low < high) {
    const mid = (low + high) >>> 1

    if (values[mid] < target) low = mid + 1
    else high = mid
  }

  return low
}

const isNode = (value: unknown): value is Node => typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string'

function childNodes (node: Node): Node[] {
  return Object.values(node).flatMap((value) => Array.isArray(value) ? value : [value]).filter(isNode)
}

function leafContext (node: Node, inTaggedTemplate: boolean): Context | undefined {
  switch (node.type) {
    case 'Literal':
      return 'regex' in node ? 'regex' : 'string'
    case 'TemplateElement':
      return inTaggedTemplate ? 'tagged-template' : 'template'
    case 'Identifier':
    case 'PrivateIdentifier':
      return 'identifier'
    default:
      return undefined
  }
}

/**
 * Finds the token each index sits in. Indexes in neither a token nor a comment
 * are between tokens.
 */
function classify (source: string, indexes: number[], onToken: (token: Token) => void) {
  const comments: Range[] = []
  let ast: Node

  try {
    ast = parse(source, {
      ...PARSE_OPTIONS,
      onComment: (_block, _text, start, end) => comments.push({ start, end }),
      onToken,
    })
  } catch (err) {
    throw new Error(
      `Could not parse the snapshot script to escape its characters above U+00FF, the first at ${describeLocation(source, indexes[0])}: ${err instanceof Error ? err.message : err}`,
      { cause: err },
    )
  }

  const contexts = new Map<number, Context>()

  const visit = (node: Node, inTaggedTemplate: boolean) => {
    const first = lowerBound(indexes, node.start)

    if (first === indexes.length || indexes[first] >= node.end) return

    const context = leafContext(node, inTaggedTemplate)

    if (context) {
      for (let i = first; i < indexes.length && indexes[i] < node.end; i++) {
        contexts.set(indexes[i], context)
      }

      return
    }

    for (const child of childNodes(node)) {
      // Expressions inside `${}` of a tagged template are ordinary code.
      const isQuasi = 'quasi' in node && child === node.quasi

      visit(child, isQuasi || (inTaggedTemplate && child.type === 'TemplateElement'))
    }
  }

  visit(ast, false)

  const commentStarts = comments.map((c) => c.start)
  const inComment = (index: number) => {
    const comment = comments[lowerBound(commentStarts, index + 1) - 1]

    return comment !== undefined && index < comment.end
  }

  return { contexts, inComment }
}

/** Writes escapes and identity escapes of chars above U+00FF in a regex pattern as the chars, which match the same */
function expandRegexChars (pattern: string) {
  return pattern.replace(REGEX_CHAR, (match, backslashes: string, hex: string | undefined, char: string | undefined) => {
    const isEscaped = backslashes.length % 2 === 1

    if (char !== undefined) return isEscaped ? backslashes.slice(1) + char : match

    const code = parseInt(hex ?? '', 16)

    return !isEscaped && code > 0xff ? backslashes + String.fromCharCode(code) : match
  })
}

function tokenValue (token: Token): unknown {
  const value: unknown = 'value' in token ? token.value : undefined

  if (typeof value === 'bigint') return `${value}n`

  if (token.type === tokTypes.regexp && typeof value === 'object' && value !== null && 'pattern' in value && 'flags' in value && typeof value.pattern === 'string') {
    return `/${expandRegexChars(value.pattern)}/${value.flags}`
  }

  return value
}

/**
 * Describes each token by its type, its cooked value and whether a line
 * terminator precedes it, which automatic semicolon insertion depends on.
 */
function tokenSignatures (source: string, onSignature: (signature: string, token: Token) => void) {
  let previousEnd = 0

  return (token: Token) => {
    const afterNewline = LINE_TERMINATOR.test(source.slice(previousEnd, token.start))

    previousEnd = token.end
    onSignature(`${token.type.label}${afterNewline ? ' after a newline' : ''} ${JSON.stringify(tokenValue(token)) ?? ''}`, token)
  }
}

function tokenDigest (source: string) {
  const hash = createHash('sha1')
  let pending = ''

  return {
    onToken: tokenSignatures(source, (signature) => {
      pending += `${signature}\n`

      if (pending.length > 1 << 20) {
        hash.update(pending)
        pending = ''
      }
    }),
    digest: () => hash.update(pending).digest('hex'),
  }
}

function firstDifference (original: string, escaped: string) {
  const expected: string[] = []
  let count = 0
  let difference = ''

  parse(original, { ...PARSE_OPTIONS, onToken: tokenSignatures(original, (signature) => expected.push(signature)) })
  parse(escaped, {
    ...PARSE_OPTIONS,
    onToken: tokenSignatures(escaped, (signature, token) => {
      if (!difference && signature !== expected[count]) {
        difference = `expected ${expected[count] ?? 'no token'} but found ${signature} at ${describeLocation(escaped, token.start)}`
      }

      count++
    }),
  })

  return difference
}

/**
 * Throws unless `escaped` has the same tokens as the script `originalDigest`
 * was taken from, so a mistake in the escaping cannot change what the snapshot
 * runs.
 */
export function assertSameTokens (original: string, escaped: string, originalDigest = digestTokens(original)) {
  const tokens = tokenDigest(escaped)

  try {
    parse(escaped, { ...PARSE_OPTIONS, onToken: tokens.onToken })
  } catch (err) {
    throw new Error(`Escaping the characters above U+00FF left the snapshot script unparseable: ${err instanceof Error ? err.message : err}`, { cause: err })
  }

  if (tokens.digest() === originalDigest) return

  throw new Error(`Escaping the characters above U+00FF changed the tokens of the snapshot script: ${firstDifference(original, escaped)}`)
}

function digestTokens (source: string) {
  const tokens = tokenDigest(source)

  parse(source, { ...PARSE_OPTIONS, onToken: tokens.onToken })

  return tokens.digest()
}

/**
 * Rewrites every character above U+00FF without changing the values, matches
 * or control flow of the script: as a `\uXXXX` escape (a surrogate pair for
 * astral chars, `\u{...}` in identifiers) inside literals, identifiers and
 * comments, and as a plain space or newline when it is whitespace or a line
 * terminator between tokens or in a comment. Source text read back through
 * `Function#toString` or `RegExp#source` shows the escapes.
 */
export function escapeNonLatin1 (source: string): { code: string, edits: Edit[] } {
  const indexes: number[] = []
  const all = new RegExp(NON_LATIN1.source, 'g')

  for (let match = all.exec(source); match; match = all.exec(source)) {
    indexes.push(match.index)
  }

  if (indexes.length === 0) return { code: source, edits: [] }

  const originalTokens = tokenDigest(source)
  const { contexts, inComment } = classify(source, indexes, originalTokens.onToken)
  const edits: Edit[] = []

  const fail = (index: number, reason: string): never => {
    throw new Error(
      `Snapshot script contains a character above U+00FF that cannot be escaped without changing its meaning (${reason}) at ${describeLocation(source, index)}`,
    )
  }

  const replace = (backslashes: string, char: string, index: number) => {
    // An odd count means the char was itself escaped (`\’`), which means the same as its `\u` escape
    const unescaped = backslashes.length % 2 === 1 ? backslashes.slice(1) : backslashes
    const isLineSeparator = LINE_SEPARATORS.test(char)

    switch (contexts.get(index)) {
      case 'string':
      case 'template':
        // A backslash before a line terminator is a line continuation, which adds nothing to the value
        return isLineSeparator && unescaped !== backslashes ? unescaped : unescaped + unicodeEscape(char)
      case 'regex':
        return unescaped + unicodeEscape(char)
      case 'tagged-template':
        return fail(index, 'inside a tagged template, whose tag can read the raw text. If the tag only reads the cooked strings, write the character as a \\uXXXX escape in the source')
      case 'identifier':
        if (!SURROGATE.test(char)) return unicodeEscape(char)

        // Identifiers reject surrogate-pair escapes, so the whole code point goes in the high surrogate's `\u{...}`
        return HIGH_SURROGATE.test(char) ? codePointEscape(source, index) : ''
      default:
        // A line terminator ends a `//` comment, whose trailing backslashes are kept, and counts as a newline for automatic semicolon insertion
        if (isLineSeparator) return `${backslashes}\n`

        if (inComment(index)) return backslashes + unicodeEscape(char)

        if (WHITESPACE.test(char)) return ' '

        return fail(index, 'outside any literal, identifier or comment')
    }
  }

  const code = source.replace(BACKSLASHES_THEN_NON_LATIN1, (match, backslashes: string, char: string, offset: number) => {
    const replacement = replace(backslashes, char, offset + backslashes.length)

    if (replacement.length !== match.length) {
      edits.push({ index: offset, delta: replacement.length - match.length })
    } else if (replacement.endsWith('\n')) {
      edits.push({ index: offset + backslashes.length, delta: 0, lineBreak: true })
    }

    return replacement
  })

  assertSameTokens(source, code, originalTokens.digest())

  return { code, edits }
}

export function assertLatin1 (source: string, filePath: string) {
  const index = source.search(NON_LATIN1)

  if (index !== -1) {
    throw new Error(
      `Snapshot script ${filePath} contains a character above U+00FF at ${describeLocation(source, index)}. V8 would store the whole script as a two-byte string; escape it as \\uXXXX.`,
    )
  }
}
