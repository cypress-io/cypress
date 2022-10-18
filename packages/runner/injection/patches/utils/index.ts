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
 * @param data - the data to send
 * @param event - the name of the event to be promisified.
 * @param timeout - in ms, if the promise does not complete during this timeout, fail the promise.
 * @returns the data to send
 */
export const postMessagePromise = <T>({ event, data = {}, timeout }: {event: string, data: any, timeout: number}): Promise<T> => {
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

/**
 * Returns a promise from the backend request for the 'request:sent:with:credentials' event.
 * @param args - an object containing a url, resourceType and Credential status.
 * @returns A Promise or null depending on the url parameter.
 */
export const requestSentWithCredentials = <T>(args: {url?: string, resourceType: 'xhr' | 'fetch', credentialStatus: string | boolean}): Promise<T> | undefined => {
  if (args.url) {
    // If cypress is enabled on the window use that, otherwise use post message to call out to the primary cypress instance.
    // cypress may be found on the window if this is either the primary cypress instance or if a spec bridge has already been created for this spec bridge.
    if (window.Cypress) {
      //@ts-expect-error
      return Cypress.backend('request:sent:with:credentials', args)
    }

    return postMessagePromise({
      event: 'backend:request',
      data: {
        args: ['request:sent:with:credentials', args],
      },
      timeout: 2000,
    })
  }

  return
}
