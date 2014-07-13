express = require("express")
http    = require("http")
path    = require("path")
fs      = require("fs")
hbs     = require("hbs")

app         = express()

## all environments
app.set 'port', "3000"

## set the eclectus config from the eclectus.json file
app.set "eclectus", JSON.parse(fs.readFileSync("eclectus.json", encoding: "utf8")).eclectus

## set the locals up here so we dont have to process them on every request

app.set "view engine", "html"
app.engine "html", hbs.__express

app.use require("compression")()
app.use require("morgan")(format: "dev")
app.use require("body-parser")()
app.use require("method-override")()

## routing for the dynamic test specs
app.get "/tests/:spec", (req, res) ->

  ## renders the testHtml file defined in the config
  res.render path.join(process.cwd(), app.get("eclectus").testHtml), {
    title:        req.params.spec
    stylesheets:  ["foo"]
    utilities:    ["bar"]
    specs:        ["baz"]
  }

## serve static file from public
app.use express.static(__dirname + "/public")

## errorhandler
app.use require("errorhandler")()

http.createServer(app).listen app.get('port'), ->
  console.log 'Express server listening on port ' + app.get('port')

console.log(process.cwd())
console.log(__dirname)