// tslint:disable-next-line no-implicit-dependencies - electron dep needs to be defined
import { shell } from 'electron'

// NOTE: in order for query params to be passed through on links
// forwardQueryParams: true must be set for that slug in the on package

export const openExternal = (url: string) => {
  return shell.openExternal(url)
}
