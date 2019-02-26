/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("./environment");

//# we are not requiring everything up front
//# to optimize how quickly electron boots while
//# in dev or linux production. the reasoning is
//# that we likely may need to spawn a new child process
//# and its a huge waste of time (about 1.5secs) of
//# synchronous requires the first go around just to
//# essentially do it all again when we boot the correct
//# mode.

const _       = require("lodash");
const cp      = require("child_process");
const path    = require("path");
const Promise = require("bluebird");
const debug   = require("debug")("cypress:server:cypress");

const exit = function(code = 0) {
  //# TODO: we shouldn't have to do this
  //# but cannot figure out how null is
  //# being passed into exit
  debug("about to exit with code", code);
  return process.exit(code);
};

const exit0 = () => exit(0);

const exitErr = function(err) {
  //# log errors to the console
  //# and potentially raygun
  //# and exit with 1
  debug('exiting with err', err);

  return require("./errors").log(err)
  .then(() => exit(1));
};

module.exports = {
  isCurrentlyRunningElectron() {
    return !!(process.versions && process.versions.electron);
  },

  runElectron(mode, options) {
    //# wrap all of this in a promise to force the
    //# promise interface - even if it doesn't matter
    //# in dev mode due to cp.spawn
    return Promise.try(() => {
      //# if we have the electron property on versions
      //# that means we're already running in electron
      //# like in production and we shouldn't spawn a new
      //# process
      if (this.isCurrentlyRunningElectron()) {
        //# just run the gui code directly here
        //# and pass our options directly to main
        return require("./modes")(mode, options);
      } else {
        return new Promise(function(resolve) {
          const cypressElectron = require("@packages/electron");
          const fn = function(code) {
            //# juggle up the totalFailed since our outer
            //# promise is expecting this object structure
            debug("electron finished with", code);
            return resolve({totalFailed: code});
          };
          return cypressElectron.open(".", require("./util/args").toArray(options), fn);
        });
      }
    });
  },

  openProject(options) {
    //# this code actually starts a project
    //# and is spawned from nodemon
    return require("./open_project").open(options.project, options);
  },

  runServer(options) {},
    // args = {}
    //
    // _.defaults options, { autoOpen: true }
    //
    // if not options.project
    //   throw new Error("Missing path to project:\n\nPlease pass 'npm run server -- --project /path/to/project'\n\n")
    //
    // if options.debug
    //   args.debug = "--debug"
    //
    // ## just spawn our own index.js file again
    // ## but put ourselves in project mode so
    // ## we actually boot a project!
    // _.extend(args, {
    //   script:  "index.js"
    //   watch:  ["--watch", "lib"]
    //   ignore: ["--ignore", "lib/public"]
    //   verbose: "--verbose"
    //   exts:   ["-e", "coffee,js"]
    //   args:   ["--", "--config", "port=2020", "--mode", "openProject", "--project", options.project]
    // })
    //
    // args = _.chain(args).values().flatten().value()
    //
    // cp.spawn("nodemon", args, {stdio: "inherit"})
    //
    // ## auto open in dev mode directly to our
    // ## default cypress web app client
    // if options.autoOpen
    //   _.delay ->
    //     require("./browsers").launch("chrome", "http://localhost:2020/__", {
    //       proxyServer: "http://localhost:2020"
    //     })
    //   , 2000
    //
    // if options.debug
    //   cp.spawn("node-inspector", [], {stdio: "inherit"})
    //
    //   require("opn")("http://127.0.0.1:8080/debug?ws=127.0.0.1:8080&port=5858")

  start(argv = []) {
    debug("starting cypress with argv %o", argv);

    const options = require("./util/args").toObject(argv);

    if (options.runProject && !options.headed) {
      // scale the electron browser window
      // to force retina screens to not
      // upsample their images when offscreen
      // rendering
      require("./util/electron_app").scale();
    }

    //# make sure we have the appData folder
    return require("./util/app_data").ensure()
    .then(() => {
      //# else determine the mode by
      //# the passed in arguments / options
      //# and normalize this mode
      const mode = (() => { switch (false) {
        case !options.version:
          return "version";

        case !options.smokeTest:
          return "smokeTest";

        case !options.returnPkg:
          return "returnPkg";

        case !options.logs:
          return "logs";

        case !options.clearLogs:
          return "clearLogs";

        case !options.getKey:
          return "getKey";

        case !options.generateKey:
          return "generateKey";

        case (options.exitWithCode == null):
          return "exitWithCode";

        case !options.runProject:
          //# go into headless mode when running
          //# until completion + exit
          return "run";

        default:
          //# set the default mode as interactive
          return options.mode || "interactive";
      } })();

      return this.startInMode(mode, options);
    });
  },

  startInMode(mode, options) {
    debug("starting in mode %s", mode);

    switch (mode) {
      case "version":
        return require("./modes/pkg")(options)
        .get("version")
        .then(version => console.log(version)).then(exit0)
        .catch(exitErr);

      case "smokeTest":
        return require("./modes/smoke_test")(options)
        .then(pong => console.log(pong)).then(exit0)
        .catch(exitErr);

      case "returnPkg":
        return require("./modes/pkg")(options)
        .then(pkg => console.log(JSON.stringify(pkg))).then(exit0)
        .catch(exitErr);

      case "logs":
        //# print the logs + exit
        return require("./gui/logs").print()
        .then(exit0)
        .catch(exitErr);

      case "clearLogs":
        //# clear the logs + exit
        return require("./gui/logs").clear()
        .then(exit0)
        .catch(exitErr);

      case "getKey":
        //# print the key + exit
        return require("./project").getSecretKeyByPath(options.projectRoot)
        .then(key => console.log(key)).then(exit0)
        .catch(exitErr);

      case "generateKey":
        //# generate + print the key + exit
        return require("./project").generateSecretKeyByPath(options.projectRoot)
        .then(key => console.log(key)).then(exit0)
        .catch(exitErr);

      case "exitWithCode":
        return require("./modes/exit")(options)
        .then(exit)
        .catch(exitErr);

      case "run":
        //# run headlessly and exit
        //# with num of totalFailed
        return this.runElectron(mode, options)
        .get("totalFailed")
        .then(exit)
        .catch(exitErr);

      case "interactive":
        return this.runElectron(mode, options);

      case "server":
        return this.runServer(options);

      case "openProject":
        //# open + start the project
        return this.openProject(options);

      default:
        throw new Error(`Cannot start. Invalid mode: '${mode}'`);
    }
  }
};
