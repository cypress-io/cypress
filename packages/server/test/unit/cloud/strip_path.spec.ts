import { describe, it, expect } from 'vitest'
import { stripPath } from '../../../lib/cloud/strip_path'

describe('lib/cloud/strip_path', () => {
  describe('stripPath', () => {
    it('strips a posix path down to its file name', () => {
      expect(stripPath('Error at /Users/foo/project/cypress/e2e/spec.cy.js:10:5')).toEqual('Error at <stripped-path>spec.cy.js:10:5')
    })

    it('strips a windows path with an uppercase drive letter', () => {
      expect(stripPath('at C:\\Users\\foo\\spec.js:1:2')).toEqual('at <stripped-path>spec.js:1:2')
    })

    it('strips a windows path with a lowercase drive letter', () => {
      expect(stripPath('at c:\\users\\foo\\spec.js')).toEqual('at <stripped-path>spec.js')
    })

    it('strips a UNC path that starts with repeated backslashes', () => {
      expect(stripPath('at \\\\server\\share\\file.txt')).toEqual('at <stripped-path>file.txt')
    })

    it('strips a path with mixed separators', () => {
      expect(stripPath('at /a\\b/c.js')).toEqual('at <stripped-path>c.js')
    })

    it('strips the opening quote of a quoted path', () => {
      expect(stripPath(`Cannot find module '/a/b/c.js'`)).toEqual(`Cannot find module <stripped-path>c.js'`)
    })

    it('strips every path in the text', () => {
      expect(stripPath('ENOENT /a/b/one.js and /c/d/two.js')).toEqual('ENOENT <stripped-path>one.js and <stripped-path>two.js')
    })

    it('strips the portion of a relative path after its first separator', () => {
      expect(stripPath('relative foo/bar/baz.js')).toEqual('relative foo<stripped-path>baz.js')
    })

    it('leaves text without paths unchanged', () => {
      expect(stripPath('no paths here: just text')).toEqual('no paths here: just text')
    })

    it('returns an empty string for empty input', () => {
      expect(stripPath('')).toEqual('')
    })
  })
})
