require("../../spec_helper")

_            = require("lodash")
fs           = require("fs-extra")
cp           = require("child_process")
path         = require("path")
http         = require("http")
human        = require("human-interval")
morgan       = require("morgan")
express      = require("express")
Promise      = require("bluebird")
snapshot     = require("snap-shot-it")
Fixtures     = require("./fixtures")
allowDestroy = require("#{root}../lib/util/server_destroy")
user         = require("#{root}../lib/user")
stdout       = require("#{root}../lib/stdout")
cypress      = require("#{root}../lib/cypress")
Project      = require("#{root}../lib/project")
settings     = require("#{root}../lib/util/settings")

cp = Promise.promisifyAll(cp)
fs = Promise.promisifyAll(fs)

env = process.env
env.COPY_CIRCLE_ARTIFACTS = "true"

e2ePath = Fixtures.projectPath("e2e")
pathUpToProjectName = Fixtures.projectPath("")

stackTraceLinesRe = /(\s+)at\s(.+)/g

replaceStackTraceLines = (str) ->
  str.replace(stackTraceLinesRe, "$1at stack trace line")

normalizeStdout = (str) ->
  ## remove all of the dynamic parts of stdout
  ## to normalize against what we expected
  str
  .split(pathUpToProjectName)
    .join("/foo/bar/.projects")
  .replace(/\(\d{1,2}s\)/g, "(10s)")
  .replace(/\s\(\d+m?s\)/g, "")
  .replace(/coffee-\d{3}/g, "coffee-456")
  .replace(/(.+)(\/.+\.mp4)/g, "$1/abc123.mp4") ## replace dynamic video names
  .replace(/Cypress Version\: (.+)/, "Cypress Version: 1.2.3")
  .replace(/Duration\: (.+)/, "Duration:        10 seconds")
  .replace(/\(\d+ seconds?\)/, "(0 seconds)")
  .replace(/\r/g, "")
  .split("\n")
    .map(replaceStackTraceLines)
    .join("\n")
  .split("2560x1440") ## normalize resolutions
    .join("1280x720")

startServer = (obj) ->
  {onServer, port} = obj

  app = express()

  srv = http.Server(app)

  allowDestroy(srv)

  app.use(morgan("dev"))

  if s = obj.static
    opts = if _.isObject(s) then s else {}
    app.use(express.static(e2ePath, opts))

  new Promise (resolve) ->
    srv.listen port, =>
      console.log "listening on port: #{port}"
      onServer?(app)

      resolve(srv)

stopServer = (srv) ->
  srv.destroyAsync()

module.exports = {
  setup: (options = {}) ->
    if options.npmInstall
      before ->
        ## npm install needs extra time
        @timeout(human("2 minutes"))

        cp.execAsync("npm install", {
          cwd: Fixtures.path("projects/e2e")
          maxBuffer: 1024*1000
        })
        .then ->
          ## symlinks mess up fs.copySync
          ## and bin files aren't necessary for these tests
          fs.removeAsync(Fixtures.path("projects/e2e/node_modules/.bin"))

      after ->
        fs.removeAsync(Fixtures.path("projects/e2e/node_modules"))

    beforeEach ->
      Fixtures.scaffold()

      @sandbox.stub(process, "exit")

      user.set({name: "brian", authToken: "auth-token-123"})
      .then =>
        Project.add(e2ePath)
      .then =>
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
      Fixtures.remove()

      if s = @servers
        Promise.map(s, stopServer)

  options: (ctx, options = {}) ->
    _.defaults(options, {
      project: e2ePath
      timeout: if options.debug then 3000000 else 120000
    })

    ctx.timeout(options.timeout)

    if spec = options.spec
      ## normalize the path to the spec
      options.spec = spec = path.join("cypress", "integration", spec)

    return options

  args: (options = {}) ->
    args = ["--run-project=#{options.project}"]

    if options.spec
      args.push("--spec=#{options.spec}")

    if options.port
      args.push("--port=#{options.port}")

    if options.hosts
      args.push("--hosts=#{options.hosts}")

    if options.debug
      args.push("--show-headless-gui")

    if options.reporter
      args.push("--reporter=#{options.reporter}")

    if options.reporterOptions
      args.push("--reporter-options=#{options.reporterOptions}")

    if browser = (env.BROWSER or options.browser)
      args.push("--browser=#{browser}")

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

    new Promise (resolve, reject) ->
      sp = cp.spawn "node", args, {env: _.omit(env, "CYPRESS_DEBUG")}

      ## pipe these to our current process
      ## so we can see them in the terminal
      sp.stdout.pipe(process.stdout)
      sp.stderr.pipe(process.stderr)

      sp.stdout.on "data", (buf) ->
        stdout += buf.toString()
      sp.stderr.on "data", (buf) ->
        stderr += buf.toString()
      sp.on "error", reject
      sp.on "exit", (code) ->
        if (expected = options.expectedExitCode)?
          try
            expect(expected).to.eq(code)
          catch err
            return reject(err)

        ## snapshot the stdout!
        if options.snapshot
          try
            ## enable callback to modify stdout
            if ostd = options.onStdout
              stdout = ostd(stdout)

            str = normalizeStdout(stdout)
            snapshot(str)
          catch err
            reject(err)

        resolve({
          code:   code
          stdout: stdout
          stderr: stderr
        })
}
