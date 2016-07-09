var path = require("path")
var browserify = require("browserify")

var d = new Date

var cb = function(err, result){
  console.log(err, result && result.toString())
  console.log(new Date - d)
}

var file = path.join(__dirname, "simple.js")

var options = {
  ast: false,
  presets: ["es2015", "react"]
}

browserify()
.transform("babelify", options)
.add(file)
.bundle(cb)
// .pipe(process.stdout)