// NOTE: in order for query params to be passed through on links
// forwardQueryParams: true must be set for that slug in the on package

export const openExternal = (url: string) => {
  return require('electron').shell.openExternal(url)
}
