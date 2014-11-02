commander = require("commander")
path      = require("path")
nodemon   = require("nodemon")
pkg       = require("../package.json")

module.exports =
  class extends require('events').EventEmitter
    constructor: (args)->
      super
      @initialize.apply(@, args);

    initialize: -> @_initCommander()

    parseCliArguments: (args) =>
      @emit 'verbose', 'parsing Cli Arguments'
      @displayHelp() if (args.length is 2)

      commander.parse(process.argv)

    displayHelp: =>
      @emit 'verbose', 'displayCliHelp'
      commander.help()

    generateScaffold: =>
      @emit 'verbose', 'generating ECL scaffold'
      require("yeoman-generator")("eclectus")
      .register(
        path.join(__dirname, "..", "lib", "generator-eclectus", "config"),
        "eclectus"
      )
      .run()

    runCiEcl: (options) =>
      @emit 'verbose', 'run ECL CI mode'
      server = path.join(__dirname, "..", "lib", "ci.coffee")

      # THIS NEEDS TO BE FIXED
      str = ""

      str += "--debug " if options.debug
      str += "--verbose --watch " + path.dirname(server) + "/**/*.coffee " + server

      @_bootServer(str)

    startEcl: (options) =>
      @emit 'verbose', 'run ECL UI mode'
      # bail immediately here if we dont have the eclectus.json file
      # tell us to run install

      # need to add the eclectus.json file to the watch list
      server = path.join(__dirname, "..", "lib", "server.coffee")

      # watch other .coffee files based on the directory our server.coffee file is in
      # need to optionally accept a --debug argument here to put
      # nodemon into debug mode instead of always putting in there

      # THIS NEEDS TO BE FIXED
      str = ""
      str += "--debug " if options.debug
      str += "--verbose --watch " + path.dirname(server) + "/**/*.coffee " + server

      ## this tells nodemon to pass on the remaining arguments to our program
      ## for some reason it will blow up unless we pass -L to it....
      str += " -- -L "
      str += "--ids #{options.ids} " if options.ids
      str += "--port=#{options.port} " if options.port

      console.log str

      @_bootServer(str)

    _bootServer: (opts) ->
      @emit 'verbose', "server started with #{opts}"

      nodemon(opts)
      .on "start", => @emit "verbose", "server started"
      .on "restart", (files) => @emit "verbose", "server restarted ", files

    _initCommander: ->
      commander
        .version(pkg.version)
        .option('--verbose', 'logs verbose messaging')

      commander
        .command("install")
        .description("• Installs Eclectus")
        .option('--verbose')
        .action(@generateScaffold)

      commander
        .command("start")
        .description("• Starts the Eclectus server")
        .option("-d, --debug", "Starts the server in debug mode")
        .option("-p, --port <n>", "Forces the server to start under a different port", parseInt)
        .option("--no-ids", "Turns off generating ID's for tests")
        .action(@startEcl)

      commander
        .command("ci")
        .description("• Runs Tests in PhantomJS (Continuous Integration Mode)")
        .option("-d, --debug", "Starts the server in debug mode")
        .action(@runCiEcl)