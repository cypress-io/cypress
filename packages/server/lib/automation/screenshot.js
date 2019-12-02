/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const log = require("debug")("cypress:server:screenshot");
const screenshots = require("../screenshots");

module.exports = screenshotsFolder =>
  ({
    capture(data, automate) {
      return screenshots.capture(data, automate)
      .then(function(details) {
        //# if there are no details, this is part of a multipart screenshot
        //# and should not be saved
        if (!details) { return; }

        return screenshots.save(data, details, screenshotsFolder)
        .then(savedDetails => screenshots.afterScreenshot(data, savedDetails));}).catch(function(err) {
        screenshots.clearMultipartState();
        throw err;
      });
    }

  })
;
