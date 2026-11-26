export const overrideServiceWorkerRegistration = (binding) => {
  // The service worker container won't be available in different situations (like in the placeholder iframes we create
  // in open mode). So only override the register function if it exists.
  if (window.ServiceWorkerContainer) {
    const oldRegister = window.ServiceWorkerContainer.prototype.register

    window.ServiceWorkerContainer.prototype.register = function (scriptURL, options) {
      const anchor = document.createElement('a')

      let resolvedHref: URL

      if (typeof scriptURL === 'string') {
        anchor.setAttribute('href', scriptURL)
        resolvedHref = new URL(anchor.href)
      } else {
        resolvedHref = scriptURL
      }

      anchor.remove()
      const resolvedUrl = `${resolvedHref.origin}${resolvedHref.pathname}`

      const serviceWorkerRegistrationEvent = {
        type: 'service-worker-registration',
        scriptURL: resolvedUrl,
        initiatorOrigin: window.location.origin,
      }

      binding(JSON.stringify(serviceWorkerRegistrationEvent))

      return oldRegister.apply(this, [scriptURL, options])
    }
  }
}

// The most efficient way to do this is to listen for the navigate event. However, this is only available in chromium browsers (after 102).
// For older versions and for webkit, we need to listen for click events on anchor tags with the download attribute.
export const listenForDownload = (binding) => {
  if (binding) {
    const createDownloadEvent = (destination) => {
      return JSON.stringify({
        type: 'download',
        destination,
      })
    }

    if (window.navigation) {
      window.navigation.addEventListener('navigate', (event) => {
        if (typeof event.downloadRequest === 'string') {
          binding(createDownloadEvent(event.destination.url))
        }
      })
    } else {
      document.addEventListener('click', (event) => {
        if (event.target instanceof HTMLAnchorElement && typeof event.target.download === 'string') {
          binding(createDownloadEvent(event.target.href))
        }
      })

      document.addEventListener('keydown', (event) => {
        if (event.target instanceof HTMLAnchorElement && event.key === 'Enter' && typeof event.target.download === 'string') {
          binding(createDownloadEvent(event.target.href))
        }
      })
    }
  }
}
