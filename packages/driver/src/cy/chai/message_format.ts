// Assertion messages embed values from the user's app and tests, so these
// helpers scan with indexOf. A regex that retries from every failed match
// position takes quadratic time or worse on a long value.

const allPropertyWordsBetweenSingleQuotes = /('.*?')/g
const allBetweenFourStars = /\*\*.*\*\*/
const allNumberStrings = /'([0-9]+)'/g
const allEmptyStrings = /''/g
const allSingleQuotes = /'/g
const allEscapedSingleQuotes = /\\'/g
const allQuoteMarkers = /__quote__/g
const allQuadStars = /\*\*\*\*/g
const leadingWhitespaces = /\*\*'\s*/g
const whitespace = /\s/g
// Each alternative is fixed-length, so a test is linear. One whitespace
// character is enough to know a longer run exists.
const valueHasLeadingOrTrailingWhitespace = /\*\*'\s|\s'\*\*/
const lineTerminator = /([\n\r\u2028\u2029])/

// A placeholder or image never spans a line break, so the scanners work one
// line at a time.
const mapLines = (str: string, fn: (line: string) => string): string => {
  // The capture group keeps the terminators at the odd indices
  return str.split(lineTerminator).map((part, i) => i % 2 ? part : fn(part)).join('')
}

// Bolds every `#{name}` placeholder. The name needs at least one character,
// and that first character may itself be `}`.
const boldPlaceholdersInLine = (line: string): string => {
  let out = ''
  let pos = 0

  while (true) {
    const start = line.indexOf('#{', pos)

    if (start === -1) break

    const end = line.indexOf('}', start + 3)

    // With no closing brace after this start, none exists after any later one
    if (end === -1) break

    out += `${line.slice(pos, start)}**${line.slice(start, end + 1)}**`
    pos = end + 1
  }

  return out + line.slice(pos)
}

// Wraps every `![alt](src)` in double backticks so it renders as code instead
// of an image. The alt text runs to the first `](`, so it may contain `]`, and
// the source runs to the first `)` after that.
const escapeImagesInLine = (line: string): string => {
  let out = ''
  let pos = 0

  while (true) {
    const start = line.indexOf('![', pos)

    if (start === -1) break

    const middle = line.indexOf('](', start + 2)

    if (middle === -1) break

    const end = line.indexOf(')', middle + 2)

    // A later `![` would reach the same `](` and miss the same `)`
    if (end === -1) break

    out += `${line.slice(pos, start)}\`\`${line.slice(start, end + 1)}\`\``
    pos = end + 1
  }

  return out + line.slice(pos)
}

// Marks the quote of every `'**` as one to keep, and turns the whitespace
// directly before it into `&nbsp;` so markdown doesn't collapse it.
const keepTrailingWhitespace = (str: string): string => {
  const parts = str.split(`'**`)

  return parts.map((part, i) => {
    if (i === parts.length - 1) return part

    // trimEnd strips the same characters as `\s`, so both sides of a value
    // agree on what counts as whitespace
    const text = part.trimEnd()

    return `${text}${'&nbsp;'.repeat(part.length - text.length)}__quote__**`
  }).join('')
}

const boldPlaceholders = (str: string): string => mapLines(str, boldPlaceholdersInLine)

export const escapeMarkdown = (message: string): string => mapLines(message, escapeImagesInLine)

// Rewrites a chai message template (not the expected or actual value) so its
// placeholders and quoted words render in bold.
export const formatMessageTemplate = (template: string): string => {
  return boldPlaceholders(template)
  .replace(allEscapedSingleQuotes, '__quote__')
  .replace(allPropertyWordsBetweenSingleQuotes, '**$1**')
  // Bolding text that is already bold leaves `****`
  .replace(allQuadStars, '**')
}

// Removes the single quotes from the values between `**`. Escaped quotes stay,
// as do the quotes of an empty string or a number string such as '42', so
// those still read as strings.
export const removeOrKeepSingleQuotesBetweenStars = (message: string): string => {
  return message.replace(allBetweenFourStars, (match) => {
    if (valueHasLeadingOrTrailingWhitespace.test(match)) {
      // Keep the quotes and turn the whitespace into `&nbsp;` so a value's
      // leading or trailing whitespace stays visible. Both sides are handled
      // even when only one has whitespace, as in '   love'.
      match = keepTrailingWhitespace(match.replace(leadingWhitespaces, (match) => {
        return match.replace(`**'`, '**__quote__')
        .replace(whitespace, '&nbsp;')
      }))
    }

    // Quotes to keep become `__quote__` so the next pass can strip the rest
    return match
    .replace(allEscapedSingleQuotes, '__quote__')
    .replace(allNumberStrings, '__quote__$1__quote__')
    .replace(allEmptyStrings, '__quote____quote__')
    .replace(allSingleQuotes, '')
    .replace(allQuoteMarkers, '\'')
  })
}
