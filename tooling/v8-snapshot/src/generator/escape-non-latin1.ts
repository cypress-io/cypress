import { parse } from 'acorn'

const NON_LATIN1 = /[^\0-\xff]/
const BACKSLASHES_THEN_NON_LATIN1 = /(\\*)([^\0-\xff])/g

function unicodeEscape (codeUnit: number) {
  return `\\u${codeUnit.toString(16).toUpperCase().padStart(4, '0')}`
}

function lineAndColumn (source: string, index: number) {
  const before = source.slice(0, index)
  const line = before.split('\n').length

  return { line, column: index - before.lastIndexOf('\n') }
}

function describeLocation (source: string, index: number) {
  const { line, column } = lineAndColumn(source, index)
  const excerpt = source.slice(Math.max(0, index - 40), index + 40).replace(/\n/g, '\\n')

  return `line ${line}, column ${column}: ${excerpt}`
}

function nonLatin1Indexes (source: string) {
  const indexes: number[] = []
  const re = new RegExp(NON_LATIN1.source, 'g')
  let match: RegExpExecArray | null

  while ((match = re.exec(source))) {
    indexes.push(match.index)
  }

  return indexes
}

type Node = { type: string, start: number, end: number }

const isNode = (value: unknown): value is Node => typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string'

function childNodes (node: Node): Node[] {
  return Object.values(node).flatMap((value) => Array.isArray(value) ? value : [value]).filter(isNode)
}

// A tag such as `String.raw` sees the raw text, and a surrogate-pair escape is not a valid identifier.
function assertEscapable (source: string, indexes: number[]) {
  const ast = parse(source, {
    ecmaVersion: 'latest',
    sourceType: 'script',
    allowHashBang: true,
    allowReturnOutsideFunction: true,
  })

  const indexIn = (node: Node) => indexes.find((i) => i >= node.start && i < node.end)

  const visit = (node: Node, inTaggedTemplate: boolean) => {
    const index = indexIn(node)

    if (index === undefined) return

    const tagged = inTaggedTemplate && node.type === 'TemplateElement'
    const astralIdentifier = node.type === 'Identifier' && /[\ud800-\udfff]/.test(source.slice(node.start, node.end))

    if (tagged || astralIdentifier) {
      throw new Error(
        `Snapshot script contains a character above U+00FF that cannot be escaped without changing its meaning (${tagged ? 'inside a tagged template' : 'astral character in an identifier'}) at ${describeLocation(source, index)}. Write it as a \\uXXXX escape in the source if the tag only reads the cooked strings, or avoid the character.`,
      )
    }

    for (const child of childNodes(node)) {
      // Expressions inside `${}` of a tagged template are ordinary code.
      const isQuasi = 'quasi' in node && child === node.quasi

      visit(child, isQuasi || (inTaggedTemplate && child.type === 'TemplateElement'))
    }
  }

  visit(ast, false)
}

// V8 retains the snapshot script source for lazy compilation, and one char above U+00FF makes it store all of it as UTF-16.
export function escapeNonLatin1 (source: string): string {
  const indexes = nonLatin1Indexes(source)

  if (indexes.length === 0) return source

  assertEscapable(source, indexes)

  return source.replace(BACKSLASHES_THEN_NON_LATIN1, (_match, backslashes: string, char: string) => {
    // An odd count means the char was itself escaped (`\’`), which means the same as its `\u` escape
    const kept = backslashes.length % 2 === 1 ? backslashes.slice(1) : backslashes

    return `${kept}${unicodeEscape(char.charCodeAt(0))}`
  })
}

export function assertLatin1 (source: string, filePath: string) {
  const index = source.search(NON_LATIN1)

  if (index !== -1) {
    throw new Error(
      `Snapshot script ${filePath} contains a character above U+00FF at ${describeLocation(source, index)}. V8 would store the whole script as a two-byte string; escape it as \\uXXXX.`,
    )
  }
}
