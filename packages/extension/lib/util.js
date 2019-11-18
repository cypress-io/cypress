/* eslint-env browser */

// const debug = require('debug')('ex')

module.exports = {
  getCookieUrl: (cookie = {}) => {
    const prefix = cookie.secure ? 'https://' : 'http://'

    return prefix + cookie.domain + (cookie.path || '')
  },

  startRecording (cb) {
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

      const mediaRecorder = new window.MediaRecorder(stream, options)

      mediaRecorder.start(200)

      // debug('extension started recording video')
      mediaRecorder.addEventListener('dataavailable', (e) => {
        // console.log(e)
        cb(e.data)
        // Cypress.action('recorder:frame', e.data)
      })
    })
  },
}
