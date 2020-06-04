/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const r       = require("@cypress/request");
const rp      = require("@cypress/request-promise");
const Promise = require("bluebird");
const fs      = require("./util/fs");

module.exports = {
  send(pathToFile, url) {
    return fs
    .readFileAsync(pathToFile)
    .then(buf => rp({
      url,
      method: "PUT",
      body: buf
    }));
  }
};
