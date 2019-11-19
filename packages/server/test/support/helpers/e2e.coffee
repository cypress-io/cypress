require("../../spec_helper")

_            = require("lodash")
cp           = require("child_process")
niv          = require("npm-install-version")
path         = require("path")
http         = require("http")
human        = require("human-interval")
morgan       = require("morgan")
express      = require("express")
Promise      = require("bluebird")
snapshot     = require("snap-shot-it")
debug        = require("debug")("cypress:support:e2e")
httpsProxy   = require("@packages/https-proxy")
Fixtures     = require("./fixtures")
fs           = require("#{root}../lib/util/fs")
allowDestroy = require("#{root}../lib/util/server_destroy")
user         = require("#{root}../lib/user")
cypress      = require("#{root}../lib/cypress")
Project      = require("#{root}../lib/project")
screenshots  = require("#{root}../lib/screenshots")
videoCapture = require("#{root}../lib/video_capture")
settings     = require("#{root}../lib/util/settings")

cp = Promise.promisifyAll(cp)

env = _.clone(process.env)

Promise.config({
  longStackTraces: true
})

e2ePath = Fixtures.projectPath("e2e")
pathUpToProjectName = Fixtures.projectPath("")

DEFAULT_BROWSERS = ['electron', 'chrome']

stackTraceLinesRe = /(\n?\s*).*?(@|at).*\.(js|coffee|ts|html|jsx|tsx)(-\d+)?:\d+:\d+[\n\S\s]*?(\n\s*\n|$)/g
browserNameVersionRe = /(Browser\:\s+)(Custom |)(Electron|Chrome|Canary|Chromium|Firefox)(\s\d+)(\s\(\w+\))?(\s+)/
availableBrowsersRe = /(Available browsers found are: )(.+)/g

## this captures an entire stack trace and replaces it with [stack trace lines]
## so that the stdout can contain stack traces of different lengths
## '@' will be present in firefox stack trace lines
## 'at' will be present in chrome stack trace lines
replaceStackTraceLines = (str) ->
  str.replace(stackTraceLinesRe, "$1[stack trace lines]$5")

replaceBrowserName = (str, key, customBrowserPath, browserName, version, headless, whitespace) ->
  ## get the padding for the existing browser string
  lengthOfExistingBrowserString = _.sum([browserName.length, version.length, _.get(headless, "length", 0), whitespace.length])

  ## this ensures we add whitespace so the border is not shifted
  key + customBrowserPath + _.padEnd("FooBrowser 88", lengthOfExistingBrowserString)

replaceDurationSeconds = (str, p1, p2, p3, p4) ->
  ## get the padding for the existing duration
  lengthOfExistingDuration = _.sum([p2?.length or 0, p3.length, p4.length])

  p1 + _.padEnd("X seconds", lengthOfExistingDuration)

replaceDurationFromReporter = (str, p1, p2, p3) ->
  ## duration='1589'
  p1 + _.padEnd("X", p2.length, "X") + p3

replaceNodeVersion = (str, p1, p2, p3) ->
  return _.padEnd("#{p1}X (/foo/bar/node)", (p1.length + p2.length + p3.length))

replaceDurationInTables = (str, p1, p2) ->
  ## when swapping out the duration, ensure we pad the
  ## full length of the duration so it doesn't shift content
  _.padStart("XX:XX", p1.length + p2.length)

replaceParenTime = (str, p1) ->
  ## could be (1 second) or (10 seconds)
  ## need to account for shortest and longest
  return _.padStart("(X second)", p1.length)

replaceScreenshotDims = (str, p1) ->
  return _.padStart("(YxX)", p1.length)

replaceUploadingResults = (orig, match..., offset, string) ->
  results = match[1].split('\n').map((res) ->
    res.replace(/\(\d+\/(\d+)\)/g, '(*/$1)')
  )
  .sort()
  .join('\n')
  ret =  match[0] + results + match[3]

  return ret

normalizeStdout = (str, options = {}) ->
  normalizeOptions = _.defaults({}, options, {normalizeAvailableBrowsers: true})

  ## remove all of the dynamic parts of stdout
  ## to normalize against what we expected
  str = str
  ## /Users/jane/........../ -> //foo/bar/.projects/
  ## (Required when paths are printed outside of our own formatting)
  .split(pathUpToProjectName).join("/foo/bar/.projects")

  if normalizeOptions.normalizeAvailableBrowsers
    # usually we are not interested in the browsers detected on this particular system
    # but some tests might filter / change the list of browsers
    # in that case the test should pass "normalizeAvailableBrowsers:false" as options
    str = str.replace(availableBrowsersRe, "$1browser1, browser2, browser3")

  str = str
  .replace(browserNameVersionRe, replaceBrowserName)
  ## numbers in parenths
  .replace(/\s\(\d+([ms]|ms)\)/g, "")
  ## 12:35 -> XX:XX
  .replace(/(\s+?)(\d+ms|\d+:\d+:?\d+)/g, replaceDurationInTables)
  .replace(/(coffee|js)-\d{3}/g, "$1-456")
  ## Cypress: 2.1.0 -> Cypress: 1.2.3
  .replace(/(Cypress\:\s+)(\d\.\d\.\d)/g, "$1" + "1.2.3")
  ## Node Version: 10.2.3 (Users/jane/node) -> Node Version: X (foo/bar/node)
  .replace(/(Node Version\:\s+v)(\d+\.\d+\.\d+)( \(.*\)\s+)/g, replaceNodeVersion)
  ## 15 seconds -> X second
  .replace(/(Duration\:\s+)(\d+\sminutes?,\s+)?(\d+\sseconds?)(\s+)/g, replaceDurationSeconds)
  ## duration='1589' -> duration='XXXX'
  .replace(/(duration\=\')(\d+)(\')/g, replaceDurationFromReporter)
  ## (15 seconds) -> (XX seconds)
  .replace(/(\((\d+ minutes?,\s+)?\d+ seconds?\))/g, replaceParenTime)
  .replace(/\r/g, "")
  ## replaces multiple lines of uploading results (since order not guaranteed)
  .replace(/(Uploading Results.*?\n\n)((.*-.*[\s\S\r]){2,}?)(\n\n)/g, replaceUploadingResults)
  ## fix "Require stacks" for CI
  .replace(/^(\- )(\/.*\/packages\/server\/)(.*)$/gm, "$1$3")

  if options.sanitizeScreenshotDimensions
    ## screenshot dimensions
    str = str.replace(/(\(\d+x\d+\))/g, replaceScreenshotDims)

  return replaceStackTraceLines(str)

ensurePort = (port) ->
  if port is 5566
    throw new Error('Specified port cannot be on 5566 because it conflicts with --inspect-brk=5566')

startServer = (obj) ->
  { onServer, port, https } = obj

  ensurePort(port)

  app = express()

  if https
    srv = httpsProxy.httpsServer(app)
  else
    srv = http.Server(app)

  allowDestroy(srv)

  app.use(morgan("dev"))

  if s = obj.static
    opts = if _.isObject(s) then s else {}
    app.use(express.static(e2ePath, opts))

  new Promise (resolve) ->
    srv.listen port, =>
      console.log "listening on port: #{port}"
      onServer?(app, srv)

      resolve(srv)

stopServer = (srv) ->
  srv.destroyAsync()

copy = ->
  ca = process.env.CIRCLE_ARTIFACTS

  debug("Should copy Circle Artifacts?", Boolean(ca))

  if ca
    videosFolder = path.join(e2ePath, "cypress/videos")
    screenshotsFolder = path.join(e2ePath, "cypress/screenshots")

    debug("Copying Circle Artifacts", ca, videosFolder, screenshotsFolder)

    ## copy each of the screenshots and videos
    ## to artifacts using each basename of the folders
    Promise.join(
      screenshots.copy(
        screenshotsFolder,
        path.join(ca, path.basename(screenshotsFolder))
      ),
      videoCapture.copy(
        videosFolder,
        path.join(ca, path.basename(videosFolder))
      )
    )

getMochaItFn = (only, skip, browser, specifiedBrowser) ->
  ## if we've been told to skip this test
  ## or if we specified a particular browser and this
  ## doesn't match the one we're currently trying to run...
  if skip or (specifiedBrowser and specifiedBrowser isnt browser)
    ## then skip this test
    return it.skip

  if only
    return it.only

  return it

getBrowsers = (generateTestsForDefaultBrowsers, browser, defaultBrowsers) ->
  ## if we're generating tests for default browsers
  if generateTestsForDefaultBrowsers
    ## then return an array of default browsers
    return defaultBrowsers

  ## but if we haven't been told to generate tests for default browsers
  ## and weren't provided a specified browser then throw
  if not browser
    throw new Error('A browser must be specified when { generateTestsForDefaultBrowsers: false }.')

  ## otherwise return the specified browser
  return [browser]

localItFn = (title, options = {}) ->
  options = _
  .chain(options)
  .clone()
  .defaults({
    only: false,
    skip: false,
    browser: process.env.BROWSER
    generateTestsForDefaultBrowsers: true
    onRun: (execFn, browser, ctx) ->
      execFn()
  })
  .value()

  { only, skip, browser, generateTestsForDefaultBrowsers, onRun, spec, expectedExitCode } = options

  if not title
    throw new Error('e2e.it(...) must be passed a title as the first argument')

  ## LOGIC FOR AUTOGENERATING DYNAMIC TESTS
  ## - if generateTestsForDefaultBrowsers
  ##   - create multiple tests for each default browser
  ##   - if browser is specified in options:
  ##     ...skip the tests for each default browser if that browser
  ##     ...does not match the specified one (used in CI)
  ## - else only generate a single test with the specified browser

  ## run the tests for all the default browsers, or if a browser
  ## has been specified, only run it for that
  specifiedBrowser = browser
  browsersToTest = getBrowsers(generateTestsForDefaultBrowsers, browser, DEFAULT_BROWSERS)

  browserToTest = (browser) ->
    mochaItFn = getMochaItFn(only, skip, browser, specifiedBrowser)

    testTitle = "#{title} [#{browser}]"

    mochaItFn testTitle, ->
      originalTitle = @test.parent.titlePath().concat(title).join(" / ")

      ctx = @

      execFn = (overrides = {}) ->
        e2e.exec(ctx, _.extend({ originalTitle }, options, overrides, { browser }))

      onRun(execFn, browser, ctx)

  return _.each(browsersToTest, browserToTest)

localItFn.only = (title, options) ->
  options.only = true
  localItFn(title, options)

localItFn.skip = (title, options) ->
  options.skip = true
  localItFn(title, options)

module.exports = e2e = {
  normalizeStdout,

  it: localItFn

  snapshot: (args...) ->
    args = _.compact(args)

    ## grab the last element in index
    index = args.length - 1

    ## normalize the stdout of it
    args[index] = normalizeStdout(args[index])

    snapshot.apply(null, args)

  setup: (options = {}) ->
    if npmI = options.npmInstall
      before ->
        ## npm install needs extra time
        @timeout(human("2 minutes"))

        cp.execAsync("npm install", {
          cwd: Fixtures.path("projects/e2e")
          maxBuffer: 1024*1000
        })
        .then ->
          if _.isArray(npmI)

            copyToE2ENodeModules = (module) ->
              fs.copyAsync(
                path.resolve("node_modules", module), Fixtures.path("projects/e2e/node_modules/#{module}")
              )

            Promise
            .map(npmI, niv.install)
            .then ->
              Promise.map(npmI, copyToE2ENodeModules)

        .then ->
          ## symlinks mess up fs.copySync
          ## and bin files aren't necessary for these tests
          fs.removeAsync(Fixtures.path("projects/e2e/node_modules/.bin"))

      after ->
        ## now cleanup the node modules after because these add a lot
        ## of copy time for the Fixtures scaffolding
        fs.removeAsync(Fixtures.path("projects/e2e/node_modules"))

    beforeEach ->
      ## after installing node modules copying all of the fixtures
      ## can take a long time (5-15 secs)
      @timeout(human("2 minutes"))

      Fixtures.scaffold()

      sinon.stub(process, "exit")

      Promise.try =>
        if servers = options.servers
          servers = [].concat(servers)

          Promise.map(servers, startServer)
          .then (servers) =>
            @servers = servers
        else
          @servers = null
      .then =>
        if s = options.settings
          settings.write(e2ePath, s)

    afterEach ->
      process.env = _.clone(env)

      @timeout(human("2 minutes"))

      Fixtures.remove()

      if s = @servers
        Promise.map(s, stopServer)

  options: (ctx, options = {}) ->
    _.defaults(options, {
      browser: 'electron'
      project: e2ePath
      timeout: if options.exit is false then 3000000 else 120000
      originalTitle: null
      sanitizeScreenshotDimensions: false
    })

    ctx.timeout(options.timeout)

    if spec = options.spec
      ## normalize into array and then prefix
      specs = spec.split(',').map (spec) ->
        return spec if path.isAbsolute(spec)

        path.join(options.project, "cypress", "integration", spec)

      ## normalize the path to the spec
      options.spec = specs.join(',')

    return options

  args: (options = {}) ->
    args = [
      ## hides a user warning to go through NPM module
      "--cwd=#{process.cwd()}",
      "--run-project=#{options.project}"
    ]

    if options.spec
      args.push("--spec=#{options.spec}")

    if options.port
      ensurePort(options.port)
      args.push("--port=#{options.port}")

    if options.headed
      args.push("--headed")

    if options.record
      args.push("--record")

    if options.parallel
      args.push("--parallel")

    if options.group
      args.push("--group=#{options.group}")

    if options.ciBuildId
      args.push("--ci-build-id=#{options.ciBuildId}")

    if options.key
      args.push("--key=#{options.key}")

    if options.reporter
      args.push("--reporter=#{options.reporter}")

    if options.reporterOptions
      args.push("--reporter-options=#{options.reporterOptions}")

    if browser = (options.browser)
      args.push("--browser=#{browser}")

    if options.config
      args.push("--config", JSON.stringify(options.config))

    if options.env
      args.push("--env", options.env)

    if options.outputPath
      args.push("--output-path", options.outputPath)

    if options.exit?
      args.push("--exit", options.exit)

    if options.inspectBrk
      args.push("--inspect-brk")

    return args

  start: (ctx, options = {}) ->
    options = @options(ctx, options)
    args    = @args(options)

    cypress.start(args)
    .then ->
      if (code = options.expectedExitCode)?
        expect(process.exit).to.be.calledWith(code)

  exec: (ctx, options = {}) ->
    options = @options(ctx, options)
    args    = @args(options)

    args = ["index.js"].concat(args)

    stdout = ""
    stderr = ""

    exit = (code) ->
      if (expected = options.expectedExitCode)?
        expect(code).to.eq(expected, "expected exit code")

      ## snapshot the stdout!
      if options.snapshot
        ## enable callback to modify stdout
        if ostd = options.onStdout
          stdout = ostd(stdout)

        ## if we have browser in the stdout make
        ## sure its legit
        if matches = browserNameVersionRe.exec(stdout)
          [str, key, customBrowserPath, browserName, version, headless] = matches

          browser = options.browser

          if browser and not customBrowserPath
            expect(_.capitalize(browser)).to.eq(browserName)

          expect(parseFloat(version)).to.be.a.number

          ## if we are in headed mode or in a browser other
          ## than electron
          if options.headed or (browser and browser isnt "electron")
            expect(headless).not.to.exist
          else
            expect(headless).to.include("(headless)")

        str = normalizeStdout(stdout, options)

        if options.originalTitle
          snapshot(options.originalTitle, str, { allowSharedSnapshot: true })
        else
          snapshot(str)

      return {
        code:   code
        stdout: stdout
        stderr: stderr
      }

    new Promise (resolve, reject) ->
      sp = cp.spawn "node", args, {
        env: _.chain(process.env)
        .omit("CYPRESS_DEBUG")
        .extend({
          ## FYI: color will be disabled
          ## because we are piping the child process
          COLUMNS: 100
          LINES: 24
        })
        .defaults({
          FAKE_CWD_PATH: "/XXX/XXX/XXX"
          DEBUG_COLORS: "1"
          ## prevent any Compression progress
          ## messages from showing up
          VIDEO_COMPRESSION_THROTTLE: 120000

          ## don't fail our own tests running from forked PR's
          CYPRESS_INTERNAL_E2E_TESTS: "1"
        })
        .value()
      }

      ## pipe these to our current process
      ## so we can see them in the terminal
      sp.stdout.pipe(process.stdout)
      sp.stderr.pipe(process.stderr)

      sp.stdout.on "data", (buf) ->
        stdout += buf.toString()
      sp.stderr.on "data", (buf) ->
        stderr += buf.toString()
      sp.on("error", reject)
      sp.on("exit", resolve)
    .tap(copy)
    .then(exit)

  sendHtml: (contents) -> (req, res) ->
    res.set('Content-Type', 'text/html')
    res.send("""
      <!DOCTYPE html>
      <html lang="en">
      <body>
        #{contents}
      </body>
      </html>
    """)
}
