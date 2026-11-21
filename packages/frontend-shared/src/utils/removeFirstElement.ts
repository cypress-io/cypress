const LINE_TERMINATOR = /([\n\r\u2028\u2029])/

/**
 * `<svg><title>Chrome</title><path/></svg>` becomes `<svg><path/></svg>`:
 * removes everything from the first `<title>` to the last `</title>` on the
 * same line, once. Elements spanning a line break are left in place.
 */
export function removeFirstElement (markup: string, tagName: string): string {
  const open = `<${tagName}>`
  const close = `</${tagName}>`
  // Odd indexes hold the line terminators, so joining puts them back unchanged.
  const parts = markup.split(LINE_TERMINATOR)

  for (let i = 0; i < parts.length; i += 2) {
    const line = parts[i]
    const start = line.indexOf(open)

    if (start === -1) {
      continue
    }

    const end = line.lastIndexOf(close)

    if (end >= start + open.length) {
      parts[i] = line.slice(0, start) + line.slice(end + close.length)

      return parts.join('')
    }
  }

  return markup
}
