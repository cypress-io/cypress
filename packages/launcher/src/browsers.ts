import _ = require('lodash')
import cp = require('child_process')

type BrowserNotFoundError = Error & {specificBrowserNotFound: boolean}

const browserNotFoundErr = (browsers, name: string): BrowserNotFoundError => {
  const available = _.map(browsers, 'name').join(', ')

  const err: BrowserNotFoundError
    = new Error("Browser: '#{name}' not found. Available browsers are: [#{available}]") as BrowserNotFoundError
  err.specificBrowserNotFound = true
  return err
}

module.exports = {
  launch: (browsers, name, url, args = []) => {
    const browser = _.find(browsers, {name: name})

    if (!browser) {
      throw browserNotFoundErr(browsers, name)
    }

    if (url) {
      args.unshift(url)
    }

    return cp.spawn(browser.path, args, {stdio: 'ignore'})
  }
}
