var fs = require("fs")
var path = require("path")

var file = path.join(__dirname, "lib.js")

var cb = function(err, out){
  console.timeEnd()
  console.log(arguments)
}

console.time()

fs.readFile(file, "utf8", cb)