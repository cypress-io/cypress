require("coffee-script/register")

const fs   = require("fs")
const zlib = require("zlib")
const path = require("path")
const Fixtures = require("./spec/server/helpers/fixtures")

const src  = path.join("spec/fixtures/projects/e2e/static/FiraSans-Regular.woff")
const dest = path.join("spec/fixtures/projects/e2e/static/FiraSans-Regular.woff.gz")

fs.readFile(src, (err, buf) => {
  zlib.gzip(buf, (err, zipped) => {
    console.log(dest)
    fs.writeFile(dest, zipped, (err, bytes) => {
      console.log(err, bytes)
    })
  })
})