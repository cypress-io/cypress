'use strict'
let __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { 'default': mod }
}

Object.defineProperty(exports, '__esModule', { value: true })
const screenshots_1 = __importDefault(require('../screenshots'))

function screenshot (screenshotsFolder) {
  return {
    capture (data, automate) {
      return screenshots_1.default.capture(data, automate)
      .then((details) => {
        // if there are no details, this is part of a multipart screenshot
        // and should not be saved
        if (!details) {
          return
        }

        return screenshots_1.default.save(data, details, screenshotsFolder)
        .then((savedDetails) => {
          return screenshots_1.default.afterScreenshot(data, savedDetails)
        })
      }).catch((err) => {
        screenshots_1.default.clearMultipartState()
        throw err
      })
    },
  }
}
exports.screenshot = screenshot
