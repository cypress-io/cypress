export const captureFullRequestUrl = (relativeOrAbsoluteUrlString: string, window: Window) => {
  // need to pass the window here by reference to generate the correct absolute URL if needed. Spec Bridge does NOT contain sub domain
  let url

  try {
    url = new URL(relativeOrAbsoluteUrlString).toString()
  } catch (err1) {
    try {
      // likely a relative path, construct the full url
      url = new URL(relativeOrAbsoluteUrlString, window.location.origin).toString()
    } catch (err2) {
      return undefined
    }
  }

  return url
}
