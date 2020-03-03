/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let fs       = require("fs-extra");
const cp       = require("child_process");
const os       = require("os");
const path     = require("path");
const debug    = require("debug")("cypress:electron");
const Promise  = require("bluebird");
const minimist = require("minimist");
const inspector = require("inspector");
const paths    = require("./paths");
const install  = require("./install");

fs = Promise.promisifyAll(fs);

module.exports = {
  installIfNeeded() {
    return install.check();
  },

  install() {
    debug("installing %j", arguments);

    return install.package.apply(install, arguments);
  },

  cli(argv = []) {
    const opts = minimist(argv);

    debug("cli options %j", opts);

    const pathToApp = argv[0];

    switch (false) {
      case !opts.install:
        return this.installIfNeeded();
      case !pathToApp:
        return this.open(pathToApp, argv);
      default:
        throw new Error("No path to your app was provided.");
    }
  },

  open(appPath, argv, cb) {
    debug("opening %s", appPath);

    appPath = path.resolve(appPath);
    const dest    = paths.getPathToResources("app");

    debug("appPath %s", appPath);
    debug("dest path %s", dest);

    //# make sure this path exists!
    return fs.statAsync(appPath)
    .then(function() {
      debug("appPath exists %s", appPath);

      //# clear out the existing symlink
      return fs.removeAsync(dest);}).then(function() {
      const symlinkType = paths.getSymlinkType();

      debug("making symlink from %s to %s of type %s", appPath, dest, symlinkType);

      return fs.ensureSymlinkAsync(appPath, dest, symlinkType);}).then(function() {
      const execPath = paths.getPathToExec();

      //# if running as root, no-sandbox must be passed or Chrome will not start
      if ((os.platform() === "linux") && (process.geteuid() === 0)) {
        argv.unshift("--no-sandbox");
      }

      //# we have an active debugger session
      if (inspector.url()) {
        const dp = process.debugPort + 1;

        argv.unshift(`--inspect-brk=${dp}`);

      } else {
        const opts = minimist(argv);
        if (opts.inspectBrk) {
          argv.unshift("--inspect-brk=5566");
        }
      }

      //# max HTTP header size 8kb -> 1mb
      //# https://github.com/cypress-io/cypress/issues/76
      argv.unshift(`--max-http-header-size=${1024*1024}`);

      debug("spawning %s with args", execPath, argv);

      if (debug.enabled) {
        //# enable the internal chromium logger
        argv.push("--enable-logging");
      }

      return cp.spawn(execPath, argv, {stdio: "inherit"})
      .on("close", function(code, errCode) {
        debug("electron closing %o", { code, errCode });

        if (code) {
          debug("original command was");
          debug(execPath, argv.join(" "));
        }

        if (cb) {
          debug("calling callback with code", code);
          return cb(code);

        } else {
          debug("process.exit with code", code);
          return process.exit(code);
        }
      });}).catch(function(err) {
      console.debug(err.stack);
      return process.exit(1);
    });
  }
};
