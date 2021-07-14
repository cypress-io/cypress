import _ from 'lodash'
import { shell } from 'electron'
import { machineId } from '../util/machine_id'

// NOTE: in order for query params to be passed through on links
// forwardQueryParams: true must be set for that slug in the on package

interface OpenExternalOptions {
  url: string
  params?: { [key: string]: string }
  machineId?: boolean
}

export const openExternal = async (opts: OpenExternalOptions | string) => {
  if (_.isString(opts)) {
    return shell.openExternal(opts)
  }

  const url = new URL(opts.url)

  const params = opts.params || {}

  if (opts.machineId && url.hostname === 'on.cypress.io') {
    params.machine_id = await machineId()
  }

  if (params) {
    // just add the utm_source here so we don't have to duplicate it on every link
    if (_.find(params, (_val, key) => _.includes(key, 'utm_'))) {
      params.utm_source = 'Test Runner'
    }

    url.search = new URLSearchParams(params).toString()
  }

  return shell.openExternal(url.href)
}
