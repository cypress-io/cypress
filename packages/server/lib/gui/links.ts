import _ from 'lodash'
import { shell } from 'electron'

// NOTE: in order for query params to be passed through on links
// forwardQueryParams: true must be set for that slug in the on package

interface OpenExternalOptions {
  url: string
  params: { [key: string]: string }
}

export const openExternal = (opts: OpenExternalOptions | string) => {
  if (_.isString(opts)) {
    return shell.openExternal(opts)
  }

  const url = new URL(opts.url)

  if (opts.params) {
    // just add the utm_source here so we don't have to duplicate it on every link
    if (_.find(opts.params, (_val, key) => _.includes(key, 'utm_'))) {
      opts.params.utm_source = 'Test Runner'
    }

    url.search = new URLSearchParams(opts.params).toString()
  }

  return shell.openExternal(url.href)
}
