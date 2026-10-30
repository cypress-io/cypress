import { describe, it, expect } from '@jest/globals'
// @ts-ignore - no types available
import guessEditor from 'launch-editor/guess'
import { quoteEditorBinary } from '../../../src/util/quoteEditorBinary'

describe('quoteEditorBinary', () => {
  it.each([
    'code',
    '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
    'C:\\Program Files\\Microsoft VS Code\\Code.exe',
    'code" --new-window "',
    `it's`,
    `code' --new-window '`,
    'code$HOME',
    'code & other',
    '#code',
    'code\\',
  ])('reaches launch-editor as the single value %j', (binary) => {
    expect(guessEditor(quoteEditorBinary(binary))).toEqual([binary])
  })
})
