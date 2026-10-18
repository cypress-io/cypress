import path from 'path'
import { describe, it, expect } from '@jest/globals'
import { isInsideDir } from '../../../src/util/isInsideDir'

describe('isInsideDir', () => {
  const parent = path.resolve('/project/fixtures')

  it('is true for a descendant', () => {
    expect(isInsideDir(parent, path.join(parent, 'users.json'))).toBe(true)
    expect(isInsideDir(parent, path.join(parent, 'nested', 'users.json'))).toBe(true)
  })

  it('is true for a descendant whose name starts with ..', () => {
    expect(isInsideDir(parent, path.join(parent, '..users.json'))).toBe(true)
  })

  it('is false for the directory itself', () => {
    expect(isInsideDir(parent, parent)).toBe(false)
  })

  it('is false for the parent directory and its other children', () => {
    expect(isInsideDir(parent, path.dirname(parent))).toBe(false)
    expect(isInsideDir(parent, path.resolve(parent, '..', 'secret.json'))).toBe(false)
  })

  it('is false for a sibling directory that shares a name prefix', () => {
    expect(isInsideDir(parent, path.resolve(parent, '..', 'fixtures-other', 'users.json'))).toBe(false)
  })
})
