import { findApp } from './util'
import { FoundBrowser, Browser } from '../types'
import { detectBrowserLinux } from '../linux'
import { log } from '../log'
import { merge, partial } from 'ramda'

const detectCanary = partial(findApp, [
  'Contents/MacOS/Google Chrome Canary',
  'com.google.Chrome.canary',
  'KSVersion'
])
const detectChrome = partial(findApp, [
  'Contents/MacOS/Google Chrome',
  'com.google.Chrome',
  'KSVersion'
])
const detectChromium = partial(findApp, [
  'Contents/MacOS/Chromium',
  'org.chromium.Chromium',
  'CFBundleShortVersionString'
])

type Detectors = {
  [index: string]: Function
}

const browsers: Detectors = {
  chrome: detectChrome,
  canary: detectCanary,
  chromium: detectChromium
}

export function detectBrowserDarwin(browser: Browser): Promise<FoundBrowser> {
  let fn = browsers[browser.name]

  if (!fn) {
    // ok, maybe it is custom alias?
    log('detecting custom browser %s on darwin', browser.name)
    return detectBrowserLinux(browser)
  }

  return fn()
    .then(merge({ name: browser.name }))
    .catch(() => {
      log('could not detect %s using traditional Mac methods', browser.name)
      log('trying linux search')
      return detectBrowserLinux(browser)
    })
}
