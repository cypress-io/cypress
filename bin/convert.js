#!/usr/bin/env node

var fs   = require("fs")
var path = require("path")

var EXAMPLE_SPEC = path.join(process.cwd(), "cypress", "integration", "example_spec.js")

fs.readFile(EXAMPLE_SPEC, "utf8", function(err, str){
  if (err) throw err

  var replace = function(source, dest){
    str = str.split(source).join(dest)
  }


  replace("http://localhost:8080",    "https://example.cypress.io")
  replace("to.eq('localhost:8080')",  "to.eq('example.cypress.io')")
  replace("to.eq('localhost')",       "to.eq('example.cypress.io')")
  replace("to.eq('8080')",            "to.eq('')")
  replace("to.eq('http:')",           "to.eq('https:')")
  replace("imgSrcToDataURL('/assets", "imgSrcToDataURL('https://example.cypress.io/assets")

  fs.writeFile(EXAMPLE_SPEC, str, function(err){
    if (err) throw err

    console.log("Converted example_spec.js successfully.")
  })
})