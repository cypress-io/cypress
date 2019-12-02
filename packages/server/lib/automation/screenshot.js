const screenshots = require('../screenshots')

module.exports = (screenshotsFolder) => {
  return {
    capture (data, automate) {
      return screenshots.capture(data, automate)
      .then((details) => {
        // if there are no details, this is part of a multipart screenshot
        // and should not be saved
        if (!details) {
          return
        }

        return screenshots.save(data, details, screenshotsFolder)
        .then((savedDetails) => {
          return screenshots.afterScreenshot(data, savedDetails)
        })
      }).catch((err) => {
        screenshots.clearMultipartState()
        throw err
      })
    },

  }
}
