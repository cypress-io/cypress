interface SortableBrowser {
  disabled?: boolean | null
  isVersionSupported: boolean
  isDeprecated: boolean
  displayName: string
}

/**
 * Tiers browsers so deprecated browsers (e.g. Electron) sort after supported,
 * non-deprecated browsers, while disabled/unsupported browsers always sort
 * last. Lower tier sorts first.
 */
const browserSortTier = (browser: SortableBrowser): number => {
  if (browser.disabled || !browser.isVersionSupported) {
    return 2
  }

  if (browser.isDeprecated) {
    return 1
  }

  return 0
}

/**
 * Returns a new array of browsers sorted into deprecation tiers, alphabetical
 * by displayName within each tier. Shared by the launchpad browser-selection
 * page and the top-nav browser dropdown so their ordering stays in sync.
 */
export const sortBrowsersByDeprecation = <T extends SortableBrowser>(browsers: readonly T[]): T[] => {
  return browsers.slice().sort((a, b) => {
    const tierDiff = browserSortTier(a) - browserSortTier(b)

    if (tierDiff !== 0) {
      return tierDiff
    }

    return a.displayName > b.displayName ? 1 : -1
  })
}
