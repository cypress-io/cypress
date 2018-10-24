/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Promise      = require("bluebird");
const allowDestroy = require("server-destroy");

module.exports = function(server) {
  allowDestroy(server);

  return server.destroyAsync = () =>
    Promise.promisify(server.destroy)()
    .catch(function() {})
  ;
};
      //# dont catch any errors
