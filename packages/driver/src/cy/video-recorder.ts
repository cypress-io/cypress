// TODO: record only if set in config
export function create (state, Cypress) {
  if (Cypress.browser.family === 'firefox' && Cypress.config('video') && !Cypress.config('isInteractive')
  ) {
    window.navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        // mediaSource: browser supported by user pref
        // @ts-ignore
        mediaSource: 'browser',
        frameRate: {
          exact: 30,
          // ideal: 30,
          // max: 30,
        },
      },
    })
    .then((stream) => {
      const options = {
        // videoBitsPerSecond: 2500000,
        mimeType: 'video/webm',
      }

      // @ts-ignore
      const mediaRecorder = new window.MediaRecorder(stream, options)

      mediaRecorder.start(200)

      mediaRecorder.addEventListener('dataavailable', (e) => {
        Cypress.action('recorder:frame', e.data)
      })
    })
  }
}
