import { parse } from 'acorn'

const NON_LATIN1 = /[^\0-\xff]/
const BACKSLASHES_THEN_NON_LATIN1 = /(\\*)([^\0-\xff])/g
const LINE_SEPARATORS = /[\u2028\u2029]/
const SURROGATE = /[\ud800-\udfff]/
// The non-Latin-1 code points of the ECMAScript WhiteSpace production
const WHITESPACE = /[\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/

type Range = { start: number, end: number }
type Node = Range & { type: string }
type Context = 'string' | 'regex' | 'template' | 'tagged-template' | 'identifier'

/** `delta` code units added at `index` of the original source, or with `lineBreak` the terminator at `index` became `\n` */
export type Edit = { index: number, delta: number, lineBreak?: true }

function unicodeEscape (char: string) {
  return `\\u${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`
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
function classify (source: string, indexes: number[]) {
  const comments: Range[] = []
  const ast = parse(source, {
    ecmaVersion: 'latest',
    sourceType: 'script',
    allowHashBang: true,
    allowReturnOutsideFunction: true,
    onComment: (_block, _text, start, end) => comments.push({ start, end }),
  })

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

/**
 * Rewrites every character above U+00FF without changing what the script does:
 * as a `\uXXXX` escape (a surrogate pair for astral chars) inside literals,
 * identifiers and comments, and as a plain space or newline when it is
 * whitespace or a line terminator between tokens or in a comment.
 */
export function escapeNonLatin1 (source: string): { code: string, edits: Edit[] } {
  const indexes: number[] = []
  const all = new RegExp(NON_LATIN1.source, 'g')

  for (let match = all.exec(source); match; match = all.exec(source)) {
    indexes.push(match.index)
  }

  if (indexes.length === 0) return { code: source, edits: [] }

  const { contexts, inComment } = classify(source, indexes)
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
        return SURROGATE.test(char) ? fail(index, 'astral character in an identifier') : unicodeEscape(char)
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
