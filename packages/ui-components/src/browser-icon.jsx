import _ from 'lodash'
import React from 'React'

const edgeRe = /^edge/
const firefoxRe = /^firefox/

const logoPaths = {
  canary: require('browser-logos/src/chrome-canary/chrome-canary_16x16.png'),
  chrome: require('browser-logos/src/chrome/chrome_16x16.png'),
  chromium: require('browser-logos/src/chromium/chromium_16x16.png'),
  edge: require('browser-logos/src/edge/edge_16x16.png'),
  electron: require('browser-logos/src/electron/electron_16x16.png'),
  firefox: require('browser-logos/src/firefox/firefox_16x16.png'),
}

const logoPath = (browserName) => {
  const browserKey = () => {
    if (edgeRe.test(browserName)) {
      return 'edge'
    }

    if (firefoxRe.test(browserName)) {
      return 'firefox'
    }

    return browserName
  }

  return logoPaths[_.camelCase(browserKey())]
}

const BrowserIcon = ({ browserName }) => {
  if (logoPath(browserName)) {
    return <img className='browser-icon' src={logoPath(browserName)} />
  }

  return <i className='browser-icon fas fa-fw fa-globe' />
}

export default BrowserIcon
