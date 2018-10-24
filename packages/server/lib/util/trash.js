/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fs      = require("./fs");
const path    = require("path");
const trash   = require("trash");
const Promise = require("bluebird");

module.exports = {
  folder(pathToFolder) {
    return fs.statAsync(pathToFolder)
    .then(() =>
      Promise.map(fs.readdirAsync(pathToFolder), item => trash([path.join(pathToFolder, item)]))).catch({code: "ENOENT"}, function() {
    });
  }
};
