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

const CROSS_ORIGIN_PREFIX = 'cross:origin:'

/**
 * Sets up a promisified post message
 * @param data the data to send
 * @param event the name of the event to be promisified.
 * @param timeout - in ms, if the promise does not complete during this timeout, fail the promise.
 * @returns the data to send
 */
export const postMessagePromise = ({ event, data = {}, timeout }) => {
  return new Promise((resolve, reject) => {
    const eventName = `${CROSS_ORIGIN_PREFIX}${event}`
    let timeoutId

    const responseEvent = `${eventName}:${Date.now()}`

    const handler = (event) => {
      if (event.data.event === responseEvent) {
        window.removeEventListener('message', handler)
        clearTimeout(timeoutId)
        resolve(event.data.data)
      }
    }

    timeoutId = setTimeout(() => {
      window.removeEventListener('message', handler)
      reject(new Error(`${eventName} failed to receive a response from the primary cypress instance within ${timeout / 1000} second.`))
    }, timeout)

    window.addEventListener('message', handler)

    window.top?.postMessage({
      event: eventName,
      data,
      responseEvent,
    }, '*')
  })
}
