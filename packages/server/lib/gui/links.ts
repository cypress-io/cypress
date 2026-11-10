// tslint:disable-next-line no-implicit-dependencies - electron dep needs to be defined
import { shell } from 'electron'

const ALLOWED_PROTOCOLS = ['http:', 'https:']

// NOTE: in order for query params to be passed through on links
// forwardQueryParams: true must be set for that slug in the on package

export const openExternal = (url: string) => {
  if (typeof url !== 'string' || !URL.canParse(url) || !ALLOWED_PROTOCOLS.includes(new URL(url).protocol)) {
    return Promise.reject(new Error(`Only http and https URLs can be opened externally: ${url}`))
  }

  return shell.openExternal(url)
}
