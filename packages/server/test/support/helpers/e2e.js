/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS201: Simplify complex destructure assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../../spec_helper");

const _            = require("lodash");
let cp           = require("child_process");
const niv          = require("npm-install-version");
const path         = require("path");
const http         = require("http");
const human        = require("human-interval");
const morgan       = require("morgan");
const express      = require("express");
const Promise      = require("bluebird");
const snapshot     = require("snap-shot-it");
const debug        = require("debug")("cypress:support:e2e");
const httpsProxy   = require("@packages/https-proxy");
const Fixtures     = require("./fixtures");
const fs           = require(`${root}../lib/util/fs`);
const allowDestroy = require(`${root}../lib/util/server_destroy`);
const user         = require(`${root}../lib/user`);
const cypress      = require(`${root}../lib/cypress`);
const Project      = require(`${root}../lib/project`);
const screenshots  = require(`${root}../lib/screenshots`);
const videoCapture = require(`${root}../lib/video_capture`);
const settings     = require(`${root}../lib/util/settings`);

cp = Promise.promisifyAll(cp);

const env = _.clone(process.env);

Promise.config({
  longStackTraces: true
});

const e2ePath = Fixtures.projectPath("e2e");
const pathUpToProjectName = Fixtures.projectPath("");

const stackTraceLinesRe = /^(\s+)at\s(.+)/gm;
const browserNameVersionRe = /(Browser\:\s+)(Custom |)(Electron|Chrome|Canary|Chromium|Firefox)(\s\d+)(\s\(\w+\))?(\s+)/;
const availableBrowsersRe = /(Available browsers found are: )(.+)/g;

const replaceStackTraceLines = str => str.replace(stackTraceLinesRe, "$1at stack trace line");

const replaceBrowserName = function(str, key, customBrowserPath, browserName, version, headless, whitespace) {
  //# get the padding for the existing browser string
  const lengthOfExistingBrowserString = _.sum([browserName.length, version.length, _.get(headless, "length", 0), whitespace.length]);

  //# this ensures we add whitespace so the border is not shifted
  return key + customBrowserPath + _.padEnd("FooBrowser 88", lengthOfExistingBrowserString);
};

const replaceDurationSeconds = function(str, p1, p2, p3, p4) {
  //# get the padding for the existing duration
  const lengthOfExistingDuration = _.sum([(p2 != null ? p2.length : undefined) || 0, p3.length, p4.length]);

  return p1 + _.padEnd("X seconds", lengthOfExistingDuration);
};

const replaceDurationFromReporter = (str, p1, p2, p3) => //# duration='1589'

p1 + _.padEnd("X", p2.length, "X") + p3;

const replaceDurationInTables = (str, p1, p2) => //# when swapping out the duration, ensure we pad the
//# full length of the duration so it doesn't shift content
_.padStart("XX:XX", p1.length + p2.length);

const replaceUploadingResults = function(orig, ...rest) {
  const adjustedLength = Math.max(rest.length, 2), match = rest.slice(0, adjustedLength - 2), offset = rest[adjustedLength - 2], string = rest[adjustedLength - 1];
  const results = match[1].split('\n').map(res => res.replace(/\(\d+\/(\d+)\)/g, '(*/$1)'))
  .sort()
  .join('\n');
  const ret =  match[0] + results + match[3];

  return ret;
};

const normalizeStdout = function(str, options = {}) {
  //# remove all of the dynamic parts of stdout
  //# to normalize against what we expected
  str = str
  .split(pathUpToProjectName)
    .join("/foo/bar/.projects")
  .replace(availableBrowsersRe, "$1browser1, browser2, browser3")
  .replace(browserNameVersionRe, replaceBrowserName)
  .replace(/\s\(\d+([ms]|ms)\)/g, "") //# numbers in parenths
  .replace(/(\s+?)(\d+ms|\d+:\d+:?\d+)/g, replaceDurationInTables) //# durations in tables
  .replace(/(coffee|js)-\d{3}/g, "$1-456")
  .replace(/(.+)(\/.+\.mp4)/g, "$1/abc123.mp4") //# replace dynamic video names
  .replace(/(Cypress\:\s+)(\d\.\d\.\d)/g, "$11.2.3") //# replace Cypress: 2.1.0
  .replace(/(Duration\:\s+)(\d+\sminutes?,\s+)?(\d+\sseconds?)(\s+)/g, replaceDurationSeconds)
  .replace(/(duration\=\')(\d+)(\')/g, replaceDurationFromReporter) //# replace duration='1589'
  .replace(/\((\d+ minutes?,\s+)?\d+ seconds?\)/g, "(X seconds)")
  .replace(/\r/g, "")
  .replace(/(Uploading Results.*?\n\n)((.*-.*[\s\S\r]){2,}?)(\n\n)/g, replaceUploadingResults); //# replaces multiple lines of uploading results (since order not guaranteed)

  if ((options.browser !== undefined) && (options.browser !== 'electron')) {
    str = str.replace(/\(\d{2,4}x\d{2,4}\)/g, "(YYYYxZZZZ)"); //# screenshot dimensions
  }

  return str.split("\n")
    .map(replaceStackTraceLines)
    .join("\n");
};

const startServer = function(obj) {
  let s, srv;
  const { onServer, port, https } = obj;

  const app = express();

  if (https) {
    srv = httpsProxy.httpsServer(app);
  } else {
    srv = http.Server(app);
  }

  allowDestroy(srv);

  app.use(morgan("dev"));

  if (s = obj.static) {
    const opts = _.isObject(s) ? s : {};
    app.use(express.static(e2ePath, opts));
  }

  return new Promise(resolve => srv.listen(port, () => {
    console.log(`listening on port: ${port}`);
    if (typeof onServer === 'function') {
      onServer(app, srv);
    }

    return resolve(srv);
  }));
};

const stopServer = srv => srv.destroyAsync();

const copy = function() {
  const ca = process.env.CIRCLE_ARTIFACTS;

  debug("Should copy Circle Artifacts?", Boolean(ca));

  if (ca) {
    const videosFolder = path.join(e2ePath, "cypress/videos");
    const screenshotsFolder = path.join(e2ePath, "cypress/screenshots");

    debug("Copying Circle Artifacts", ca, videosFolder, screenshotsFolder);

    //# copy each of the screenshots and videos
    //# to artifacts using each basename of the folders
    return Promise.join(
      screenshots.copy(
        screenshotsFolder,
        path.join(ca, path.basename(screenshotsFolder))
      ),
      videoCapture.copy(
        videosFolder,
        path.join(ca, path.basename(videosFolder))
      )
    );
  }
};

module.exports = {
  normalizeStdout,

  snapshot(...args) {
    args = _.compact(args);

    //# grab the last element in index
    const index = args.length - 1;

    //# normalize the stdout of it
    args[index] = normalizeStdout(args[index]);

    return snapshot.apply(null, args);
  },

  setup(options = {}) {
    let npmI;
    if (npmI = options.npmInstall) {
      before(function() {
        //# npm install needs extra time
        this.timeout(human("2 minutes"));

        return cp.execAsync("npm install", {
          cwd: Fixtures.path("projects/e2e"),
          maxBuffer: 1024*1000
        })
        .then(function() {
          if (_.isArray(npmI)) {

            const copyToE2ENodeModules = module => fs.copyAsync(
              path.resolve("node_modules", module), Fixtures.path(`projects/e2e/node_modules/${module}`)
            );

            return Promise
            .map(npmI, niv.install)
            .then(() => Promise.map(npmI, copyToE2ENodeModules));
          }}).then(() => //# symlinks mess up fs.copySync
        //# and bin files aren't necessary for these tests
        fs.removeAsync(Fixtures.path("projects/e2e/node_modules/.bin")));
      });

      after(() => //# now cleanup the node modules after because these add a lot
      //# of copy time for the Fixtures scaffolding
      fs.removeAsync(Fixtures.path("projects/e2e/node_modules")));
    }

    beforeEach(function() {
      //# after installing node modules copying all of the fixtures
      //# can take a long time (5-15 secs)
      this.timeout(human("2 minutes"));

      Fixtures.scaffold();

      sinon.stub(process, "exit");

      return Promise.try(() => {
        let servers;
        if (servers = options.servers) {
          servers = [].concat(servers);

          return Promise.map(servers, startServer)
          .then(servers => {
            return this.servers = servers;
          });
        } else {
          return this.servers = null;
        }
    }).then(() => {
        let s;
        if (s = options.settings) {
          return settings.write(e2ePath, s);
        }
      });
    });

    return afterEach(function() {
      let s;
      process.env = _.clone(env);

      this.timeout(human("2 minutes"));

      Fixtures.remove();

      if (s = this.servers) {
        return Promise.map(s, stopServer);
      }
    });
  },

  options(ctx, options = {}) {
    let spec;
    _.defaults(options, {
      browser: process.env.BROWSER,
      project: e2ePath,
      timeout: options.exit === false ? 3000000 : 120000
    });

    ctx.timeout(options.timeout);

    if (spec = options.spec) {
      //# normalize into array and then prefix
      const specs = spec.split(',').map(function(spec) {
        if (path.isAbsolute(spec)) { return spec; }

        return path.join(options.project, "cypress", "integration", spec);
      });

      //# normalize the path to the spec
      options.spec = specs.join(',');
    }

    return options;
  },

  args(options = {}) {
    let browser;
    const args = [
      //# hides a user warning to go through NPM module
      `--cwd=${process.cwd()}`,
      `--run-project=${options.project}`
    ];

    if (options.spec) {
      args.push(`--spec=${options.spec}`);
    }

    if (options.port) {
      args.push(`--port=${options.port}`);
    }

    if (options.headed) {
      args.push("--headed");
    }

    if (options.record) {
      args.push("--record");
    }

    if (options.parallel) {
      args.push("--parallel");
    }

    if (options.group) {
      args.push(`--group=${options.group}`);
    }

    if (options.ciBuildId) {
      args.push(`--ci-build-id=${options.ciBuildId}`);
    }

    if (options.key) {
      args.push(`--key=${options.key}`);
    }

    if (options.reporter) {
      args.push(`--reporter=${options.reporter}`);
    }

    if (options.reporterOptions) {
      args.push(`--reporter-options=${options.reporterOptions}`);
    }

    if (browser = (options.browser)) {
      args.push(`--browser=${browser}`);
    }

    if (options.config) {
      args.push("--config", JSON.stringify(options.config));
    }

    if (options.env) {
      args.push("--env", options.env);
    }

    if (options.outputPath) {
      args.push("--output-path", options.outputPath);
    }

    if (options.exit != null) {
      args.push("--exit", options.exit);
    }

    if (options.inspectBrk) {
      args.push("--inspect-brk");
    }

    return args;
  },

  start(ctx, options = {}) {
    options = this.options(ctx, options);
    const args    = this.args(options);

    return cypress.start(args)
    .then(function() {
      let code;
      if ((code = options.expectedExitCode) != null) {
        return expect(process.exit).to.be.calledWith(code);
      }
    });
  },

  exec(ctx, options = {}) {
    options = this.options(ctx, options);
    let args    = this.args(options);

    args = ["index.js"].concat(args);

    let stdout = "";
    let stderr = "";

    const exit = function(code) {
      let expected;
      if ((expected = options.expectedExitCode) != null) {
        expect(code).to.eq(expected, "expected exit code");
      }

      //# snapshot the stdout!
      if (options.snapshot) {
        //# enable callback to modify stdout
        let matches, ostd, str;
        if (ostd = options.onStdout) {
          stdout = ostd(stdout);
        }

        //# if we have browser in the stdout make
        //# sure its legit
        if (matches = browserNameVersionRe.exec(stdout)) {
          let browserName, customBrowserPath, headless, key, version;
          [str, key, customBrowserPath, browserName, version, headless] = matches;

          const {
            browser
          } = options;

          if (browser && !customBrowserPath) {
            expect(_.capitalize(browser)).to.eq(browserName);
          }

          expect(parseFloat(version)).to.be.a('number');

          //# if we are in headed mode or in a browser other
          //# than electron
          if (options.headed || (browser && (browser !== "electron"))) {
            expect(headless).not.to.exist;
          } else {
            expect(headless).to.include("(headless)");
          }
        }

        str = normalizeStdout(stdout, options);
        snapshot(str);
      }

      return {
        code,
        stdout,
        stderr
      };
    };

    return new Promise(function(resolve, reject) {
      const sp = cp.spawn("node", args, {
        env: _.chain(process.env)
        .omit("CYPRESS_DEBUG")
        .extend({
          //# FYI: color will already be disabled
          //# because we are piping the child process
          COLUMNS: 100,
          LINES: 24
        })
        .defaults({
          DEBUG_COLORS: "1",

          //# prevent any Compression progress
          //# messages from showing up
          VIDEO_COMPRESSION_THROTTLE: 120000,

          //# don't fail our own tests running from forked PR's
          CYPRESS_INTERNAL_E2E_TESTS: "1"
        })
        .value()
      });

      //# pipe these to our current process
      //# so we can see them in the terminal
      sp.stdout.pipe(process.stdout);
      sp.stderr.pipe(process.stderr);

      sp.stdout.on("data", buf => stdout += buf.toString());
      sp.stderr.on("data", buf => stderr += buf.toString());
      sp.on("error", reject);
      return sp.on("exit", resolve);}).tap(copy)
    .then(exit);
  },

  sendHtml(contents) { return function(req, res) {
    res.set('Content-Type', 'text/html');
    return res.send(`\
<!DOCTYPE html>
<html lang="en">
<body>
  ${contents}
</body>
</html>\
`);
  }; }
};
