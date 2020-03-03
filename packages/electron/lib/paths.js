/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const os   = require("os");
const path = require("path");

const distPath = "dist/Cypress";

const execPath = {
  darwin:  "Cypress.app/Contents/MacOS/Cypress",
  freebsd: "Cypress",
  linux:   "Cypress",
  win32:   "Cypress.exe"
};

const resourcesPath = {
  darwin:  "Cypress.app/Contents/Resources",
  freebsd: "resources",
  linux:   "resources",
  win32:   "resources"
};

const unknownPlatformErr = function() {
  throw new Error(`Unknown platform: '${os.platform()}'`);
};

const normalize = (...paths) => path.join(__dirname, "..", ...paths);

module.exports = {
  getPathToDist(...paths) {
    paths = [distPath].concat(paths);

    return normalize(...paths);
  },

  getPathToExec() {
    let left;
    const p = (left = execPath[os.platform()]) != null ? left : unknownPlatformErr();

    return this.getPathToDist(p);
  },

  getPathToResources(...paths) {
    let left;
    let p = (left = resourcesPath[os.platform()]) != null ? left : unknownPlatformErr();

    p = [].concat(p, paths);

    return this.getPathToDist(...p);
  },

  getPathToVersion() {
    return this.getPathToDist("version");
  },

  getSymlinkType() {
    if (os.platform() === "win32") { 
      return "junction"; 
    } else { 
      return "dir";
    }
  }
};
