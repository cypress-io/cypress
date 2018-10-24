/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const scale = function() {
  try {
    const { app } = require("electron");
    return app.commandLine.appendSwitch("force-device-scale-factor", "1");
  } catch (error) {}
};

const ready = function() {
  const Promise = require("bluebird");
  const { app } = require("electron");

  const waitForReady = () =>
    new Promise(function(resolve, reject) {
      return app.on("ready", resolve);
    })
  ;

  return Promise.any([
    waitForReady(),
    Promise.delay(500)
  ]);
};

module.exports = {
  scale,

  ready
};
