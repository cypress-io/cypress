/// <reference path="../../../cli/types/cypress-automation.d.ts" />

export type AutomationElementId = `${string}-string`

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
  'Escape',
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
class InvalidKeyError extends Error {
  constructor (key: string) {
    super(`${key} is not supported by 'cy.press()'. Single-character keys are supported, as well as a selection of utility keys: ${NamedKeys.join(', ')}`)
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

/**
 * Kind of device a native `pointer` input source emulates.
 */
export type NativeInputPointerType = 'mouse' | 'pen' | 'touch'

/**
 * Waits `duration` milliseconds before the source's next action. Every source
 * accepts it, so a source can stay idle while other sources act in the same tick.
 */
export interface NativeInputPauseAction {
  type: 'pause'
  duration: number
}

/**
 * Moves a pointer to `x`, `y`: CSS pixels relative to the AUT iframe's
 * viewport, before the runner scales the iframe.
 */
export interface NativeInputPointerMoveAction {
  type: 'pointerMove'
  x: number
  y: number
}

/**
 * Presses a pointer button at the pointer's current position. `button` follows
 * `MouseEvent.button` (0 primary, 1 auxiliary, 2 secondary). `pressure` is
 * between 0 and 1, for pen and touch sources.
 */
export interface NativeInputPointerDownAction {
  type: 'pointerDown'
  button: number
  pressure?: number
}

/**
 * Releases a pointer button pressed by a `pointerDown` action.
 */
export interface NativeInputPointerUpAction {
  type: 'pointerUp'
  button: number
  pressure?: number
}

/**
 * Presses a key. `value` is the key's `KeyboardEvent.key`: a single character,
 * or a named key such as `Enter` or `Shift`.
 */
export interface NativeInputKeyDownAction {
  type: 'keyDown'
  value: string
}

/**
 * Releases a key pressed by a `keyDown` action.
 */
export interface NativeInputKeyUpAction {
  type: 'keyUp'
  value: string
}

/**
 * Scrolls the wheel by `deltaX`, `deltaY` CSS pixels with the cursor at `x`,
 * `y`, relative to the AUT iframe's viewport before the runner's scaling.
 */
export interface NativeInputScrollAction {
  type: 'scroll'
  x: number
  y: number
  deltaX: number
  deltaY: number
}

/**
 * A mouse, pen or touch input source and the actions it performs, in order.
 */
export interface NativeInputPointerSource {
  type: 'pointer'
  id: string
  parameters: {
    pointerType: NativeInputPointerType
  }
  actions: Array<NativeInputPointerMoveAction | NativeInputPointerDownAction | NativeInputPointerUpAction | NativeInputPauseAction>
}

/**
 * A keyboard input source and the actions it performs, in order.
 */
export interface NativeInputKeySource {
  type: 'key'
  id: string
  actions: Array<NativeInputKeyDownAction | NativeInputKeyUpAction | NativeInputPauseAction>
}

/**
 * A scroll wheel input source and the actions it performs, in order.
 */
export interface NativeInputWheelSource {
  type: 'wheel'
  id: string
  actions: Array<NativeInputScrollAction | NativeInputPauseAction>
}

/**
 * Any native input source.
 */
export type NativeInputSource = NativeInputPointerSource | NativeInputKeySource | NativeInputWheelSource

/**
 * Payload of the `input:actions` automation message, modeled on WebDriver BiDi
 * `input.performActions`. The backend runs the sources' actions tick by tick:
 * tick N performs the Nth action of every source before tick N + 1 starts.
 * Input state, such as held keys and buttons, persists until `input:reset`.
 */
export interface NativeInputActionsParams {
  sources: NativeInputSource[]
}
