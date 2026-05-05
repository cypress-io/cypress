export const parseHashFromBundleUrl = (url: string): string => {
  const fileName = url.split('/').pop()
  const hash = fileName?.split('.')[0]

  if (!hash) {
    throw new Error(`Unable to parse bundle hash from URL: ${url}`)
  }

  return hash
}
