/// <reference path="../../../cli/types/cypress-automation.d.ts" />

export type AutomationElementId = `${string}-string`

const invalidKeyErrorKind = 'InvalidKeyError'

export type SupportedNamedKey = Cypress.SupportedNamedKey

export const SpaceKey = 'Space'

/**
 * Array of all supported named keys that can be used with cy.press().
 * These are special keys that have specific meanings beyond single characters.
 */
export const NamedKeys: SupportedNamedKey[] = [
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'End',
  'Home',
  'PageDown',
  'PageUp',
  'Enter',
  'Tab',
  'Backspace',
  SpaceKey,
  'Delete',
  'Insert',
]

// utility type to enable the SupportedKey union type
enum SupportedKeyType {}

/**
 * Union type representing all keys supported by cy.press().
 * Includes single-character strings (including unicode characters with multiple code points)
 * and named utility keys.
 * Must be cast to via `toSupportedKey` or guarded with `isSupportedKey`
 * to ensure it is a valid key.
 */
export type SupportedKey = SupportedKeyType & string

function isSingleDigitNumber (key: number | string): boolean {
  return typeof key === 'number' && key === Math.floor(key) && key >= 0 && key <= 9
}

/**
 * Type guard that checks if a string is a supported key for cy.press().
 * @param key The string to check
 * @returns True if the key is supported (single character or named key)
 */
export function isSupportedKey (key: string | number): key is SupportedKey {
  if (isSingleDigitNumber(key)) {
    return isSupportedKey(String(key))
  }

  if (!(typeof key === 'string')) {
    return false
  }

  // Normalize the string to combine combining characters
  const normalizedKey = key.normalize('NFC')

  return (
    // Check if it's a single grapheme cluster (user-perceived character)
    // This handles multi-codepoint characters like emoji with modifiers
    [...normalizedKey].length === 1 ||
    NamedKeys.includes(key as SupportedNamedKey)
  )
}

/**
 * Error thrown when an unsupported key is used with cy.press().
 * Provides information about which keys are supported.
 */
export class InvalidKeyError extends Error {
  kind = invalidKeyErrorKind
  constructor (key: string) {
    super(`${key} is not supported by 'cy.press()'. Single-character keys are supported, as well as a selection of utility keys: ${NamedKeys.join(', ')}`)
  }
  static isInvalidKeyError (e: any): e is InvalidKeyError {
    return e.kind === invalidKeyErrorKind
  }
}

/**
 * Converts a string to a SupportedKey, throwing an error if invalid.
 * @param key The string key to validate and convert
 * @returns The validated SupportedKey
 * @throws InvalidKeyError when the key is not supported
 */
export function toSupportedKey (key: string | number): SupportedKey {
  if (typeof key === 'number' && key >= 0 && key <= 9) {
    return toSupportedKey(String(key))
  }

  if (isSupportedKey(key)) {
    return key
  }

  throw new InvalidKeyError(String(key))
}
