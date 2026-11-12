// Assertion messages embed values from the user's app and tests, so these
// helpers scan with indexOf rather than regexes that restart at every failed
// match position, which is quadratic or worse on a long adversarial value.

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

// The scanners below replace patterns built on `.`, which never matches a
// line terminator, so they work one line at a time to keep matches on a line.
const mapLines = (str: string, fn: (line: string) => string): string => {
  // The capture group keeps the terminators at the odd indices
  return str.split(lineTerminator).map((part, i) => i % 2 ? part : fn(part)).join('')
}

// Bolds every `#{name}` placeholder. Like `/#{.+?}/g`, the name needs at least
// one character and that first character may itself be `}`.
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
// of an image. Like `/!\[.*?\]\(.*?\)/g`, the alt text runs to the first `](`
// and so may contain `]`, and the source runs to the first `)` after that.
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

    // trimEnd strips the same characters `\s` matches
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
  // when a value has ** in it, **** are sometimes created after the process above.
  // remove them with this.
  .replace(allQuadStars, '**')
}

// remove any single quotes between our **,
// except escaped quotes, empty strings and number strings.
export const removeOrKeepSingleQuotesBetweenStars = (message: string): string => {
  // remove any single quotes between our **, preserving escaped quotes
  // and if an empty string, put the quotes back
  return message.replace(allBetweenFourStars, (match) => {
    if (valueHasLeadingOrTrailingWhitespace.test(match)) {
      // Strings like '   love' have whitespace on one side only, so each side
      // is handled whether or not it has any.
      match = keepTrailingWhitespace(match.replace(leadingWhitespaces, (match) => {
        return match.replace(`**'`, '**__quote__')
        .replace(whitespace, '&nbsp;')
      }))
    }

    return match
    .replace(allEscapedSingleQuotes, '__quote__') // preserve escaped quotes
    .replace(allNumberStrings, '__quote__$1__quote__') // preserve number strings (e.g. '42')
    .replace(allEmptyStrings, '__quote____quote__') // preserve empty strings (e.g. '')
    .replace(allSingleQuotes, '')
    .replace(allQuoteMarkers, '\'') // put escaped quotes back
  })
}
