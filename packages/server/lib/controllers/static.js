/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const send      = require("send");
const staticPkg = require("@packages/static");

module.exports = {
  handle(req, res) {
    const pathToFile = staticPkg.getPathToDist(req.params[0]);

    return send(req, pathToFile)
    .pipe(res);
  }
};
