export const initVideoRecorder = async (Cypress) => {
  // Only start recording with getUserMedia API if we're in firefox and video-enabled and run mode.
  // TODO: this logic should be cleaned up or gotten from some video-specific config value
  if (
    Cypress.isBrowser('firefox')
      && Cypress.config('video')
      && !Cypress.config('isInteractive')
      // navigator.mediaDevices will be undefined if the browser does not support display capture
      && window.navigator.mediaDevices
  ) {
    await window.navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        // mediaSource "browser" is supported by a firefox user preference
        // @ts-ignore
        mediaSource: 'browser',
        frameRate: {
          exact: 30,
        },
      },
    })
    .then((stream) => {
      const options = {
        mimeType: 'video/webm',
      }

      const mediaRecorder = new window.MediaRecorder(stream, options)

      mediaRecorder.start(200)

      mediaRecorder.addEventListener('dataavailable', (e) => {
        Cypress.action('recorder:frame', e.data)
      })
    })
  }
}
