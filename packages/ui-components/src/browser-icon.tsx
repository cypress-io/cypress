import _ from 'lodash'
import React from 'react'

interface FamilyOptions {
  [key: string]: RegExp
}

const families: FamilyOptions = {
  chrome: /^chrome/i,
  chromium: /^chromium/i,
  edge: /^edge/i,
  electron: /^electron/i,
  firefox: /^firefox/i,
}

interface LogoOptions {
  [key: string]: string
}

const logoPaths: LogoOptions = {
  canary: require('browser-logos/src/chrome-canary/chrome-canary_32x32.png'),
  chrome: require('browser-logos/src/chrome/chrome_32x32.png'),
  chromium: require('browser-logos/src/chromium/chromium_32x32.png'),
  edge: require('browser-logos/src/edge/edge_32x32.png'),
  edgeBeta: require('browser-logos/src/edge-beta/edge-beta_32x32.png'),
  edgeCanary: require('browser-logos/src/edge-canary/edge-canary_32x32.png'),
  edgeDev: require('browser-logos/src/edge-dev/edge-dev_32x32.png'),
  electron: require('browser-logos/src/electron/electron_32x32.png'),
  firefox: require('browser-logos/src/firefox/firefox_32x32.png'),
  firefoxDeveloperEdition: require('browser-logos/src/firefox-developer-edition/firefox-developer-edition_32x32.png'),
  firefoxNightly: require('browser-logos/src/firefox-nightly/firefox-nightly_32x32.png'),
}

const familyFallback = (browserKey: string) => {
  return _.reduce(families, (found, regex, family) => {
    if (found !== '') return found

    if (regex.test(browserKey)) return family

    return ''
  }, '')
}

const logoPath = (browserName: string) => {
  const browserKey = _.camelCase(browserName)

  return logoPaths[browserKey] || logoPaths[familyFallback(browserKey)]
}

interface Props {
  browserName: string
}

// browserName should be the browser's display name
const BrowserIcon = ({ browserName }: Props) => {
  if (logoPath(browserName)) {
    return <img className='browser-icon' src={logoPath(browserName)} alt={browserName} />
  }

  return <i className='browser-icon fas fa-fw fa-globe' />
}

export default BrowserIcon
