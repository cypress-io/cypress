import type { ReactNode } from 'react'

type JSX = { displayName?: unknown, name?: string }

const MODULE_SUFFIX_START = ' [from '

const LINE_TERMINATOR = /[\n\r\u2028\u2029]/

/**
 * Splits `Image [from Image.react]` into `Image` and `Image.react`, splitting
 * at the last ` [from ` like a greedy `/^(.*) \[from (.*)\]$/` would. The
 * regex is quadratic on names with many ` [from ` and no closing `]`, and its
 * `.` refuses line terminators, so a name containing one never splits.
 */
export function splitModuleSuffix (displayName: string): { componentName: string, moduleName: string } | null {
  if (!displayName.endsWith(']') || LINE_TERMINATOR.test(displayName)) {
    return null
  }

  const start = displayName.lastIndexOf(MODULE_SUFFIX_START)

  if (start === -1) {
    return null
  }

  return {
    componentName: displayName.slice(0, start),
    moduleName: displayName.slice(start + MODULE_SUFFIX_START.length, -1),
  }
}

/**
 * Gets the display name of the component when possible.
 * @param type {JSX} The type object returned from creating the react element.
 * @param fallbackName {string} The alias, or fallback name to use when the name cannot be derived.
 * @link https://github.com/facebook/react-devtools/blob/master/backend/getDisplayName.js
 */
export default function getDisplayName (
  node: ReactNode,
  fallbackName: string = 'Unknown',
): string {
  const type: JSX | undefined = (node as any)?.type

  if (!type) {
    return fallbackName
  }

  let displayName: string | null = null

  // The displayName property is not guaranteed to be a string.
  // It's only safe to use for our purposes if it's a string.
  // github.com/facebook/react-devtools/issues/803
  if (typeof type.displayName === 'string') {
    displayName = type.displayName
  }

  if (!displayName) {
    displayName = type.name || fallbackName
  }

  // Facebook-specific hack to turn "Image [from Image.react]" into just "Image".
  // We need displayName with module name for error reports but it clutters the DevTools.
  const match = splitModuleSuffix(displayName)

  if (match) {
    const { componentName, moduleName } = match

    if (componentName && moduleName) {
      if (
        moduleName === componentName ||
        moduleName.startsWith(`${componentName}.`)
      ) {
        displayName = componentName
      }
    }
  }

  return displayName
}
