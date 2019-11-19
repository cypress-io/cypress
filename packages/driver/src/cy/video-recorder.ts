// TODO: record only if set in config
export function create (state, Cypress) {
  if (Cypress.browser.family === 'firefox') {
    window.navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        // mediaSource: browser supported by user pref
        mediaSource: 'browser',
      },
    })
    .then((stream) => {
      const options = {
        // videoBitsPerSecond: 2500000,
        mimeType: 'video/webm',
      }

      const mediaRecorder = new window.MediaRecorder(stream, options)

      mediaRecorder.start(100)

      mediaRecorder.addEventListener('dataavailable', (e) => {
        Cypress.action('recorder:frame', e.data)
      })
    })
  }
}
