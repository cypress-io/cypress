var path = require("path")
var babel = require("babel-core")

var d = new Date

var cb = function(err, result){
  console.log(result.code)
  console.log(new Date - d)
}

var file = path.join(__dirname, "simple.js")

var options = {
  ast: false,
  presets: ["es2015", "react"]
}

// babel.transformFile(file, cb)
babel.transformFile(file, options, cb)