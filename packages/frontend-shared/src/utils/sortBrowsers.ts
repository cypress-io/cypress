import type { Browser } from '@packages/types/src/browser'

export default function sortBrowsers (browsers: Browser[]) {
  return browsers.sort((a, b) => a.displayName > b.displayName ? 1 : -1)
}
