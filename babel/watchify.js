var path = require("path")
var browserify = require("browserify")
var watchify = require("watchify")

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

var bundle = function(){
  b.bundle(cb)
}

var b = browserify({cache: {}, packageCache: {}})
.transform("babelify", options)
.plugin(watchify, {
  delay: 0
})
.add(file)
.on("update", function(){
  d = new Date
  bundle()
})

bundle()