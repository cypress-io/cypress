export type LinkWithParams = {
    url: string
    params: { utm_medium?: string, utm_content?: string }
  }

export const getUrlWithParams = (link: LinkWithParams) => {
  let result = link.url

  if (link.params) {
    result += `?${new URLSearchParams(link.params).toString()}`
  }

  return result
}
