export type LinkWithParams = {
  url: string
  params: { [key: string]: string }
}

export const getUrlWithParams = (link: LinkWithParams) => {
  let result = link.url

  if (link.params) {
    result += `?${new URLSearchParams(link.params).toString()}`
  }

  return result
}
