var path = require("path")
var browserify = require("browserify")

var d = new Date

var cb = function(err, result){
  console.log(err, result && result.toString())
  console.log(new Date - d)
}

var file = path.join(__dirname, "simple2.js")

browserify()
.add(file)
.bundle(cb)
// .pipe(process.stdout)