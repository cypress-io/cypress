/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $Location = require("../cypress/location");
const $utils = require("../cypress/utils");

const create = state => ({
  getRemoteLocation(key, win) {
    try {
      const remoteUrl = $utils.locToString(win != null ? win : state("window"));
      const location  = $Location.create(remoteUrl);

      if (key) {
        return location[key];
      } else {
        return location;
      }
    } catch (e) {
      return "";
    }
  }
});

module.exports = {
  create
};
