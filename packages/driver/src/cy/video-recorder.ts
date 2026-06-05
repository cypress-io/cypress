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
    // Firefox 93+ requires a transient user activation (a recent, real user gesture) before
    // display capture via getUserMedia({ mediaSource: 'browser' }) is allowed. Without it the
    // call below rejects with "Display capture requires transient activation from a user gesture"
    // and no video is recorded. Ask the server to synthesize a trusted gesture through WebDriver
    // BiDi, which grants the activation to this window right before we request the stream.
    // @see https://bugzilla.mozilla.org/show_bug.cgi?id=1729889
    // @see https://github.com/cypress-io/cypress/issues/18415
    try {
      await Cypress.automation('perform:user:gesture', {})
    } catch {
      // If the gesture can't be performed, getUserMedia is likely to fail below; that error is
      // surfaced there. We don't want a failed gesture to throw out of video recorder setup.
    }

    try {
      const stream = await window.navigator.mediaDevices.getUserMedia({
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

      const options = {
        mimeType: 'video/webm',
      }

      const mediaRecorder = new window.MediaRecorder(stream, options)

      mediaRecorder.start(200)

      mediaRecorder.addEventListener('dataavailable', (e) => {
        Cypress.action('recorder:frame', e.data)
      })
    } catch {
      // Swallow so a failure to start recording can't reject out of video recorder setup (which
      // would surface as an unhandled promise rejection). When this happens no frames are emitted,
      // so the server reports that it was unable to process/record the video for this session.
    }
  }
}
