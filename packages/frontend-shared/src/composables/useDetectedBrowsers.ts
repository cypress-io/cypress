import { gql, useQuery } from '@urql/vue'

import chromeIcon from '../../../../node_modules/browser-logos/src/chrome/chrome.svg?url'
import firefoxIcon from '../../../../node_modules/browser-logos/src/firefox/firefox.svg?url'
import edgeIcon from '../../../../node_modules/browser-logos/src/edge/edge.svg?url'
import electronIcon from '../../../../node_modules/browser-logos/src/electron/electron.svg?url'
import canaryIcon from '../../../../node_modules/browser-logos/src/chrome-canary/chrome-canary.svg?url'
import chromeBetaIcon from '../../../../node_modules/browser-logos/src/chrome-beta/chrome-beta.svg?url'
import chromiumIcon from '../../../../node_modules/browser-logos/src/chromium/chromium.svg?url'
import edgeBetaIcon from '../../../../node_modules/browser-logos/src/edge-beta/edge-beta.png'
import edgeCanaryIcon from '../../../../node_modules/browser-logos/src/edge-canary/edge-canary.png'
import edgeDevIcon from '../../../../node_modules/browser-logos/src/edge-dev/edge-dev.png'
import firefoxNightlyIcon from '../../../../node_modules/browser-logos/src/firefox-nightly/firefox-nightly.svg?url'
import firefoxDeveloperEditionIcon from '../../../../node_modules/browser-logos/src/firefox-developer-edition/firefox-developer-edition.svg?url'

const allBrowsersIcons = {
  'Electron': electronIcon,
  'Chrome': chromeIcon,
  'Firefox': firefoxIcon,
  'Edge': edgeIcon,
  'Chromium': chromiumIcon,
  'Canary': canaryIcon,
  'Chrome Beta': chromeBetaIcon,
  'Firefox Nightly': firefoxNightlyIcon,
  'Firefox Developer Edition': firefoxDeveloperEditionIcon,
  'Edge Canary': edgeCanaryIcon,
  'Edge Beta': edgeBetaIcon,
  'Edge Dev': edgeDevIcon,
}

const DetectedBrowsers = gql`
  query DetectedBrowsers {

    app {
      selectedBrowser {
        id
        displayName
        majorVersion
      }
      browsers {
        id
        name
        family
        disabled
        isSelected
        channel
        displayName
        path
        version
        majorVersion
      }
    }
  }
`

export function useDetectedBrowsers () {
  const query = useQuery({
    query: DetectedBrowsers,
  })

  const { browsers, selectedBrowser } = query.data.value.app

  const browsersWithIcons = browsers.map((browser) => {
    return {
      ...browser,
      icon: allBrowsersIcons[browser.displayName],
    }
  })

  return {
    browsers: browsersWithIcons,
    selectedBrowser: { ...selectedBrowser, icon: allBrowsersIcons[selectedBrowser.displayName] },
  }
}
