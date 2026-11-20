import { decode, encode } from '@jridgewell/sourcemap-codec'

export const NON_ASCII_AFTER_BACKSLASHES = /(\\*)([\u0080-\uffff])/g

export const unitEscape = (unit: number) => `\\u${unit.toString(16).toUpperCase().padStart(4, '0')}`

/**
 * Rewrites every character above U+007F as a `\u` escape, such as U+1E9E in a regular expression literal,
 * and moves the source map's later columns on that line by the same amount. With `charset: 'ascii'`,
 * esbuild has already escaped strings, templates and identifiers, which leaves only regular expression
 * literals and comments.
 */
export const escapeNonAscii = <Map extends { mappings: string }>(code: string, map?: Map): { code: string, map?: Map } => {
  const mappings = map ? decode(map.mappings) : undefined

  const lines = code.split('\n').map((line, lineIndex) => {
    const shifts: { column: number, delta: number }[] = []

    const escaped = line.replace(NON_ASCII_AFTER_BACKSLASHES, (match: string, backslashes: string, char: string, column: number) => {
      // A backslash before the character is an identity escape that the \u escape replaces
      const replacement = backslashes.slice(backslashes.length % 2) + unitEscape(char.charCodeAt(0))

      shifts.push({ column: column + match.length, delta: replacement.length - match.length })

      return replacement
    })

    for (const segment of (shifts.length && mappings?.[lineIndex]) || []) {
      segment[0] += shifts.reduce((sum, { column, delta }) => (segment[0] >= column ? sum + delta : sum), 0)
    }

    return escaped
  })

  return { code: lines.join('\n'), map: map && mappings ? { ...map, mappings: encode(mappings) } : map }
}
