import _ from 'lodash'
import React from 'React'

const logoPaths = {
  canary: require('browser-logos/src/chrome-canary/chrome-canary_16x16.png'),
  chrome: require('browser-logos/src/chrome/chrome_16x16.png'),
  chromium: require('browser-logos/src/chromium/chromium_16x16.png'),
  edge: require('browser-logos/src/edge/edge_16x16.png'),
  electron: require('browser-logos/src/electron/electron_16x16.png'),
  firefox: require('browser-logos/src/firefox/firefox_16x16.png'),
}

const BrowserIcon = ({ browserName }) => {
  const logoPath = logoPaths[_.camelCase(browserName)]

  if (logoPath) {
    return <img className='browser-icon' src={logoPath} />
  }

  return <i className='browser-icon fas fa-globe' />
}

export default BrowserIcon
