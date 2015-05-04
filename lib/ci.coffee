fs        = require 'fs'
spawn     = require('child_process').spawn

eclectus = JSON.parse(fs.readFileSync("eclectus.json", encoding: "utf8")).eclectus

# phantomjs = (filepath, cb) ->
#   phantom.create (err, ph) ->
#     console.log "PhantomJS ready..."
#     ph.createPage (err, page) ->
#       t = Date.now()
#       pathToPage = "http://localhost:#{eclectus.port || 2020}/#{filepath}"
#       console.log "PhantomJS opened: ", pathToPage

#       page.onError = (msg, trace) ->
#         debugger

#       page.open pathToPage, (err, status) ->
#         console.log "PhantomJS done! status: #{status}, time: #{Date.now() - t}"
#         cb?()
#   , {parameters: "remote-debugger-port": "9000", "remote-debugger-autorun": "yes"}

phantomjs = (filepath, cb) ->
  process.env["TZ"] = "America/New_York"
  phantomjs = spawn "phantomjs", ["--remote-debugger-port=9000", "--remote-debugger-autorun=yes", "node_modules/mocha-phantomjs/lib/mocha-phantomjs.coffee", "http://localhost:#{eclectus.port || 2020}/#{filepath}"]
  phantomjs.stdout.pipe process.stdout
  phantomjs.stderr.pipe process.stderr
  phantomjs.on 'exit', (code) ->
    cb?(code)
    process.exit(code)

phantomjs "#/tests/ci"

