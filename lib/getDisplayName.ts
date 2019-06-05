/// <reference path="./index.d.ts" />

const cachedDisplayNames: WeakMap<JSX, string> = new WeakMap();

/**
 * Gets the display name of the component when possible.
 * @param type {JSX} The type object returned from creating the react element.
 * @param fallbackName {string} The alias, or fallback name to use when the name cannot be derived.
 * @link https://github.com/facebook/react-devtools/blob/master/backend/getDisplayName.js
 */
export default function getDisplayName(type: JSX, fallbackName: string = 'Unknown'): string {
  const nameFromCache = cachedDisplayNames.get(type)

  if (nameFromCache != null) {
    return nameFromCache
  }

  let displayName: string

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
  const match = displayName.match(/^(.*) \[from (.*)\]$/)

  if (match) {
    const componentName = match[1]
    const moduleName = match[2]

    if (componentName && moduleName) {
      if (
        moduleName === componentName ||
        moduleName.startsWith(componentName + '.')
      ) {
        displayName = componentName
      }
    }
  }

  cachedDisplayNames.set(type, displayName)

  return displayName
}