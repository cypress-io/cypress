express = require('express')
http    = require('http')
path    = require('path')

app     = express()

## all environments
app.set 'port', "3000"

app.use require("compression")()
app.use require("morgan")(format: "dev")
app.use require("body-parser")()
app.use require("method-override")()

# app.use app.router
app.use express.static("build")

## development only
if app.get('env') is 'development'
  app.use require("errorhandler")()

http.createServer(app).listen app.get('port'), ->
  console.log 'Express server listening on port ' + app.get('port')