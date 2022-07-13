import { getUtmSource } from './getUtmSource'

export type LinkWithParams = {
  url: string
  params: { [key: string]: string }
}

export const getUrlWithParams = (link: LinkWithParams) => {
  let result = link.url
  const paramNames = Object.keys(link.params)

  if (paramNames.length > 0) {
    const hasUtmParams = paramNames.some((param) => param.startsWith('utm_'))

    if (hasUtmParams) {
      link.params.utm_source = getUtmSource()
    }

    let url: string
    let searchParams: URLSearchParams

    if (link.url.includes('?')) {
      // If input URL already includes params we should preserve them
      url = link.url.substring(0, link.url.indexOf('?'))
      searchParams = new URLSearchParams(link.url.substring(link.url.indexOf('?')))
    } else {
      url = link.url
      searchParams = new URLSearchParams()
    }

    Object.entries(link.params).forEach(([key, value]) => searchParams.append(key, value))

    result = `${url}?${searchParams.toString()}`
  }

  return result
}
