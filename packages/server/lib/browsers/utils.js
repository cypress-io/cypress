/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const path     = require("path");
const debug    = require("debug")("cypress:server:browsers:utils");
const Promise  = require("bluebird");
const getPort  = require("get-port");
const launcher = require("@packages/launcher");
const fs       = require("../util/fs");
const appData  = require("../util/app_data");
const pluralize = require("pluralize");
const profileCleaner = require("../util/profile_cleaner");

const PATH_TO_BROWSERS = appData.path("browsers");

const getBrowserPath = browser =>
  path.join(
    PATH_TO_BROWSERS,
    `${browser.name}`
  )
;

const copyExtension = (src, dest) => fs.copyAsync(src, dest);

const getPartition = function(isTextTerminal) {
  if (isTextTerminal) {
    return `run-${process.pid}`;
  }

  return "interactive";
};

const getProfileDir = (browser, isTextTerminal) =>
  path.join(
    getBrowserPath(browser),
    getPartition(isTextTerminal)
  )
;

const getExtensionDir = (browser, isTextTerminal) =>
  path.join(
    getProfileDir(browser, isTextTerminal),
    "CypressExtension"
  )
;

const ensureCleanCache = function(browser, isTextTerminal) {
  const p = path.join(
    getProfileDir(browser, isTextTerminal),
    "CypressCache"
  );

  return fs
  .removeAsync(p)
  .then(() => fs.ensureDirAsync(p)).return(p);
};

const removeOldProfiles = function() {
  //# a profile is considered old if it was used
  //# in a previous run for a PID that is either
  //# no longer active, or isnt a cypress related process
  const pathToProfiles = path.join(PATH_TO_BROWSERS, "*");
  const pathToPartitions = appData.electronPartitionsPath();

  return Promise.all([
    //# we now store profiles in either interactive or run-* folders
    //# so we need to remove the old root profiles that existed before
    profileCleaner.removeRootProfile(pathToProfiles, [
      path.join(pathToProfiles, "run-*"),
      path.join(pathToProfiles, "interactive")
    ]),
    profileCleaner.removeInactiveByPid(pathToProfiles, "run-"),
    profileCleaner.removeInactiveByPid(pathToPartitions, "run-"),
  ]);
};

module.exports = {
  getPort,

  copyExtension,

  getProfileDir,

  getExtensionDir,

  ensureCleanCache,

  removeOldProfiles,

  getBrowserByPath: launcher.detectByPath,

  launch: launcher.launch,

  getBrowsers() {
    debug("getBrowsers");
    return launcher.detect()
    .then(function(browsers = []) {
      let majorVersion;
      debug("found browsers %o", { browsers });

      const version = process.versions.chrome || "";
      if (version) { majorVersion = parseInt(version.split(".")[0]); }
      const electronBrowser = {
        name: "electron",
        family: "electron",
        displayName: "Electron",
        version,
        path: "",
        majorVersion,
        info: "Electron is the default browser that comes with Cypress. This is the browser that runs in headless mode. Selecting this browser is useful when debugging. The version number indicates the underlying Chromium version that Electron uses."
      };

      //# the internal version of Electron, which won't be detected by `launcher`
      debug("adding Electron browser with version %s", version);
      return browsers.concat(electronBrowser);
    });
  }
};
