import _ = require('lodash')
import cp = require('child_process')

const browserNotFoundErr = (browsers, name: string): BrowserNotFoundError => {
  const available = _.map(browsers, 'name').join(', ')

  const err: BrowserNotFoundError
    = new Error(`Browser: '${name}' not found. Available browsers are: [${available}]`) as BrowserNotFoundError
  err.specificBrowserNotFound = true
  return err
}

type FoundBrowser = {
  name: string,
  path: string
}

module.exports = {
  launch: (browsers, name, url, args = []) => {
    const browser:FoundBrowser = _.find(browsers, {name: name}) as FoundBrowser

    if (!browser) {
      throw browserNotFoundErr(browsers, name)
    }

    if (url) {
      args.unshift(url)
    }

    return cp.spawn(browser.path, args, {stdio: 'ignore'})
  }
}
