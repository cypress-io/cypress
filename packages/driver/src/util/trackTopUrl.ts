// trackTopUrl sends messages to the extension about URL changes. The extension needs to
// keep track of these, so it can activate the main tab when the puppeteer plugin
// requests it.

export const trackTopUrl = () => {
  // track the initial url
  window.postMessage({
    message: 'cypress:extension:url:changed',
    url: window.location.href,
  })

  // and track every time location changes
  window.addEventListener('popstate', (ev) => {
    const url = window.location.href

    window.postMessage({
      message: 'cypress:extension:url:changed',
      url,
    })
  })
}
