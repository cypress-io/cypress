export type AutomationElementId = `${string}-string`

const invalidKeyErrorKind = 'InvalidKeyError'

export type SupportedNamedKey = 'ArrowDown' |
'ArrowLeft' |
'ArrowRight' |
'ArrowUp' |
'End' |
'Home' |
'PageDown' |
'PageUp' |
'Enter' |
'Tab' |
'Backspace' |
'Delete' |
'Insert' |
'F1' |
'F2' |
'F3' |
'F4' |
'F5' |
'F6' |
'F7' |
'F8' |
'F9' |
'F10' |
'F11' |
'F12'

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
  'Delete',
  'Insert',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
]

// utility type to enable the SupportedKey union type
enum SupportedKeyType {}

/**
 * Union type representing all keys supported by cy.press().
 * Includes single-character strings (inluding unicode characters with multiple code points)
 * and named utility keys.
 * Must be cast to via `toSupportedKey` or guarded with `isSupportedKey`
 * to ensure it is a valid key.
 */
export type SupportedKey = SupportedKeyType & string

/**
 * Type guard that checks if a string is a supported key for cy.press().
 * @param key The string to check
 * @returns True if the key is supported (single character or named key)
 */
export function isSupportedKey (key: string): key is SupportedKey {
  return typeof key === 'string' && (
    [...key].length === 1 ||
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
export function toSupportedKey (key: string): SupportedKey {
  if (isSupportedKey(key)) {
    return key
  }

  throw new InvalidKeyError(key)
}
