import { describe, it, expect } from 'vitest'
import { USKeyboard } from '../src/keyboard-layout'

describe('USKeyboard', () => {
  it('defines a letter', () => {
    expect(USKeyboard.a).toEqual({ keyCode: 65, key: 'a', code: 'KeyA' })
  })

  it('defines a digit', () => {
    expect(USKeyboard['1']).toEqual({ keyCode: 49, key: '1', code: 'Digit1' })
  })

  it('defines Enter', () => {
    expect(USKeyboard.Enter).toEqual({ keyCode: 13, code: 'Enter', key: 'Enter', text: '\r' })
  })

  it('defines Tab', () => {
    expect(USKeyboard.Tab).toEqual({ keyCode: 9, code: 'Tab', key: 'Tab' })
  })
})
