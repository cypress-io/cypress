import { describe, it, expect } from 'vitest'
import {
  trimChars,
  trimStartChars,
  trimEndChars,
  isBlank,
  clean,
  camelCase,
} from '../src/string-utils'

describe('trimStartChars', () => {
  it('trims specified chars from start', () => {
    expect(trimStartChars('//foo//', '/')).toBe('foo//')
  })

  it('handles multiple char set', () => {
    expect(trimStartChars('xyxhello', 'xy')).toBe('hello')
  })

  it('returns original if no match', () => {
    expect(trimStartChars('hello', '/')).toBe('hello')
  })
})

describe('trimEndChars', () => {
  it('trims specified chars from end', () => {
    expect(trimEndChars('//foo//', '/')).toBe('//foo')
  })

  it('trims newlines', () => {
    expect(trimEndChars('hello\n\n', '\n')).toBe('hello')
  })

  it('returns original if no match', () => {
    expect(trimEndChars('hello', '/')).toBe('hello')
  })
})

describe('trimChars', () => {
  it('trims specified chars from both ends', () => {
    expect(trimChars('//foo//', '/')).toBe('foo')
  })

  it('handles multiple char set', () => {
    expect(trimChars('-_hello_-', '-_')).toBe('hello')
  })
})

describe('isBlank', () => {
  it('returns true for null', () => {
    expect(isBlank(null)).toBe(true)
  })

  it('returns true for undefined', () => {
    expect(isBlank(undefined)).toBe(true)
  })

  it('returns true for empty string', () => {
    expect(isBlank('')).toBe(true)
  })

  it('returns true for whitespace only', () => {
    expect(isBlank('   ')).toBe(true)
    expect(isBlank('\t\n')).toBe(true)
  })

  it('returns false for non-blank strings', () => {
    expect(isBlank('a')).toBe(false)
    expect(isBlank(' a ')).toBe(false)
  })
})

describe('clean', () => {
  it('collapses whitespace and trims', () => {
    expect(clean('  hello   world  ')).toBe('hello world')
  })

  it('collapses tabs and newlines', () => {
    expect(clean('a\t\tb\n\nc')).toBe('a b c')
  })

  it('handles already clean strings', () => {
    expect(clean('hello')).toBe('hello')
  })
})

describe('camelCase', () => {
  it('converts kebab-case', () => {
    expect(camelCase('foo-bar')).toBe('fooBar')
  })

  it('converts snake_case', () => {
    expect(camelCase('foo_bar')).toBe('fooBar')
  })

  it('converts PascalCase', () => {
    expect(camelCase('FooBar')).toBe('fooBar')
  })

  it('converts space-separated', () => {
    expect(camelCase('foo bar')).toBe('fooBar')
  })

  it('handles all-caps segments', () => {
    expect(camelCase('FOO_BAR')).toBe('fooBar')
  })

  it('handles mixed separators', () => {
    expect(camelCase('foo-bar_baz qux')).toBe('fooBarBazQux')
  })

  it('handles single word', () => {
    expect(camelCase('foo')).toBe('foo')
  })

  it('handles empty string', () => {
    expect(camelCase('')).toBe('')
  })

  it('handles numbers', () => {
    expect(camelCase('foo2bar')).toBe('foo2Bar')
  })
})
