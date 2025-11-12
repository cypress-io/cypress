import { expect, it, describe } from 'vitest'
import preprocessor from '../../dist/index'

describe('typescript ./dist output', () => {
  it('builds dist correctly', () => {
    expect(preprocessor).toBeInstanceOf(Function)
    expect(preprocessor).toHaveProperty('defaultOptions')
  })
})
