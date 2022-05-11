export type LinkWithParams = {
  url: string
  params: { [key: string]: string }
}

export const getUrlWithParams = (link: LinkWithParams) => {
  let result = link.url
  const hasUtmParams = Object.keys(link.params).some((param) => param.startsWith('utm_'))

  if (hasUtmParams) {
    // __CYPRESS_MODE__ is only set on the window in th browser app -
    // checking this allows us to know if links are clicked in the browser app or the launchpad
    const utm_source = window.__CYPRESS_MODE__ ? 'Binary: App' : 'Binary: Launchpad'

    link.params.utm_source = utm_source
  }

  if (link.params) {
    result += `?${new URLSearchParams(link.params).toString()}`
  }

  return result
}
