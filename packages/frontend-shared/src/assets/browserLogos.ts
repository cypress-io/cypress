import {
  IconBrowserElectronLight,
  IconBrowserChrome,
  IconBrowserChromeBeta,
  IconBrowserChromeCanary,
  IconBrowserChromeForTesting,
  IconBrowserMozillaFirefox,
  IconBrowserEdge,
  IconBrowserChromium,
  IconBrowserFirefoxNightly,
  IconBrowserFirefoxDev,
  IconBrowserEdgeCanary,
  IconBrowserEdgeBeta,
  IconBrowserEdgeDev,
  IconBrowserWebkit,
  IconGeneralGlobe,
} from '@cypress-design/vue-icon'

export const allBrowsersIcons = {
  'electron': IconBrowserElectronLight,
  'chrome': IconBrowserChrome,
  'chrome beta': IconBrowserChromeBeta,
  'canary': IconBrowserChromeCanary,
  'chrome canary': IconBrowserChromeCanary,
  'chrome for testing': IconBrowserChromeForTesting,
  'chromium': IconBrowserChromium,
  'firefox': IconBrowserMozillaFirefox,
  'firefox nightly': IconBrowserFirefoxNightly,
  'firefox developer edition': IconBrowserFirefoxDev,
  'edge': IconBrowserEdge,
  'edge beta': IconBrowserEdgeBeta,
  'edge canary': IconBrowserEdgeCanary,
  'edge dev': IconBrowserEdgeDev,
  'webkit': IconBrowserWebkit,
  'generic': IconGeneralGlobe,
}

// Browsers detected from an explicit binary path (e.g. `--browser /path/to/chrome`)
// have their display name prefixed with "Custom " (e.g. "Custom Chrome"). Strip that
// prefix when resolving the icon so custom browsers render the correct logo instead of
// falling back to the generic icon.
// @see https://github.com/cypress-io/cypress/issues/32924
export const getBrowserIcon = (displayName?: string | null) => {
  const key = displayName?.toLowerCase().replace(/^custom /, '')

  return (key && allBrowsersIcons[key]) || allBrowsersIcons.generic
}
