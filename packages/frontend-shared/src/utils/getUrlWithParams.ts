import { getUtmSource } from './getUtmSource'

export type LinkWithParams = {
  url: string
  params: { [key: string]: string }
}

export const getUrlWithParams = (link: LinkWithParams) => {
  let result = link.url
  const hasUtmParams = Object.keys(link.params).some((param) => param.startsWith('utm_'))

  if (hasUtmParams) {
    link.params.utm_source = getUtmSource()
  }

  if (link.params) {
    result += `?${new URLSearchParams(link.params).toString()}`
  }

  return result
}
