export function create (state, Cypress) {
  console.log('videorecorder')
  if (Cypress.browser.family === 'firefox') {
    console.log('isfirefox')
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
        timeslice: 1000,
      }

      const mediaRecorder = new MediaRecorder(stream, options)

      mediaRecorder.start(200)

      console.log({ mediaRecorder })
      mediaRecorder.addEventListener('dataavailable', (e) => {
        console.log(e)
        Cypress.action('recorder:frame', e.data)
      })
    })
  }
}
