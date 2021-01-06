import screenshots from '../screenshots'

export class Screenshot {
  constructor (private screenshotsFolder: string) { }

  capture (data, automate) {
    return screenshots.capture(data, automate)
    .then((details) => {
      // if there are no details, this is part of a multipart screenshot
      // and should not be saved
      if (!details) {
        return
      }

      return screenshots.save(data, details, this.screenshotsFolder)
    })
    .then((savedDetails) => {
      return screenshots.afterScreenshot(data, savedDetails)
    })
    .catch((err) => {
      screenshots.clearMultipartState()
      throw err
    })
  }
}
