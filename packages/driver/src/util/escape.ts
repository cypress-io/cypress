const quotesRe = /('|")/g
const backslashRe = /\\/g

export function escapeQuotes (text) {
  // convert to str and escape any single
  // or double quotes
  return (`${text}`).replace(quotesRe, '\\$1')
}

export function escapeBackslashes (text) {
  // convert to str and escape any backslashes
  return (`${text}`).replace(backslashRe, '\\\\')
}
