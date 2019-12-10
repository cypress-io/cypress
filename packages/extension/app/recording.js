/* eslint-env browser */

module.exports = {
  startRecording (cb) {
    window.navigator.mediaDevices.getUserMedia({
      audio: false,
      // video: true,
      video: {
        // mediaSource: browser supported by user pref
        // mediaSource: 'browser',
        displaySurface: 'browser',
      },
    })
    .then((stream) => {
      const options = {
        // videoBitsPerSecond: 2500000,
        mimeType: 'video/webm',
        timeslice: 1000,
      }

      const mediaRecorder = new window.MediaRecorder(stream, options)

      mediaRecorder.ondataavailable = (e) => {
        // const blob = e.data

        // blob.arrayBuffer()
        // .then(cb)
        cb(e.data)
      }

      mediaRecorder.start(200)
    })
  },
}
