var path = require("path")
var browserify = require("browserify")

var preset2015 = require("babel-preset-es2015")
var presetReact = require("babel-preset-react")

var d = new Date

var cb = function(err, result){
  console.log(err, result && result.toString())
  console.log(err.message)
  console.log(err.codeFrame)
  console.log(new Date - d)
}

var rc   = path.join(__dirname, "..", ".babelrc")
// var file = path.join(__dirname, "react.js")
// var file = path.join(__dirname, "c.coffee")
// var file = path.join(__dirname, "coffee-react.cjsx")
// var file = path.join(__dirname, "error.js")
var file = path.join(__dirname, "error.coffee")


var options = {
  ast: false,
  babelrc: false,
  // extends: rc
  presets: [preset2015, presetReact]
}

browserify()
.transform("cjsxify")
// .transform("babelify", options)
.add(file)
.bundle(cb)
// .pipe(process.stdout)