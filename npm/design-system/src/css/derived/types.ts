/* eslint-disable */
import type colors from './jsColors.scss'
import type { ClassNames as JsSpacing } from './jsSpacing.scss'
import type { ClassNames as JsTypography } from './jsTypography.scss'
import type {ClassNames as JsSurface } from './jsSurfaces.scss'

type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
type TwoDigit = `${Digit}${Digit}`

/**
 * Retrieve all names in `TString` that are followed by a suffix `TSuffix`
 */
type ExtractStringBeforeSuffix<TString extends string, TSuffix extends string> = TString extends `${infer S}${TSuffix}` ? S : never

/**
 * Retrieve all substrings following the prefix `TPrefix` in `TString`
 */
type ExtractStringAfterPrefix<TString extends string, TPrefix extends string> = TString extends `${TPrefix}${infer S}` ? S : never

/**
 * Convert numbered names resulting from collapsing CSS class names into their original, hyphenated form
 */
type HyphenateNumberedName<T extends string> = {
  [Key in ExtractStringBeforeSuffix<T, TwoDigit>]: `${Key}-${ExtractStringAfterPrefix<T, Key>}`
}[ExtractStringBeforeSuffix<T, TwoDigit>]

export type Color = HyphenateNumberedName<keyof typeof colors>
export type Spacing = ExtractStringAfterPrefix<JsSpacing, 'space-'>
export type SurfaceElevation = ExtractStringAfterPrefix<JsSurface, 'shadow-'>

export type TextSize = ExtractStringAfterPrefix<JsTypography, 'text-'>
export type LineHeight = ExtractStringAfterPrefix<JsTypography, 'line-height-'>