export function trimStartChars (str: string, chars: string): string {
  const charSet = new Set(chars)
  let i = 0

  while (i < str.length && charSet.has(str[i])) i++

  return str.slice(i)
}

export function trimEndChars (str: string | null | undefined, chars: string): string {
  if (str == null) return ''

  const charSet = new Set(chars)
  let i = str.length

  while (i > 0 && charSet.has(str[i - 1])) i--

  return str.slice(0, i)
}

export function trimChars (str: string, chars: string): string {
  return trimStartChars(trimEndChars(str, chars), chars)
}

export function isBlank (str: string | null | undefined): boolean {
  if (str == null) return true

  return /^\s*$/.test(str)
}

export function clean (str: string): string {
  return str.replace(/\s+/g, ' ').trim()
}

export function camelCase (str: string): string {
  const words = str
  .replace(/[^a-zA-Z0-9]+/g, ' ')
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
  .replace(/([a-zA-Z])(\d)/g, '$1 $2')
  .replace(/(\d)([a-zA-Z])/g, '$1 $2')
  .trim()
  .split(/\s+/)
  .filter(Boolean)

  return words.reduce((result, word, i) => {
    const lower = word.toLowerCase()

    return result + (i ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower)
  }, '')
}
