const path = require("path")

const pkgsDir = path.join(__dirname, "packages")

require("app-module-path").addPath(pkgsDir)

var server = require("@cypress/core-server")

// get the reporter string from cypress.json
// mochaawesome
// obviously this is 3rd party
try {
  // require it from mochas default reporters
} catch (err) {
  require(projectRoot + mochaawesome)
}

console.log("server is", server())

// const path   = require("path")
// const Module = require("module")
// const _load  = Module._load
// const _findPath  = Module._findPath
// // const req    = Module.prototype.require
// const packages = path.join(__dirname, "packages")

// Module._findPath = function(request, paths, isMain) {
//   paths.unshift(packages)

//   console.log(arguments)

//   const p = _findPath.apply(this, arguments)

//   console.log("FOUND PATH", p)

//   return p
// }

// // Module._load = function(request, parent) {

// //   parent.paths.unshift(packages)
// //   parent.parent.paths.unshift(packages)

// //   try {
// //     return _load.apply(this, arguments)
// //   } catch (err) {
// //     console.log(err, parent)
// //   }

// //   // try {
// //   //   return _load.apply(this, arguments)
// //   // }
// //   // catch (err) {
// //   //   // var pkg = path.join(__dirname, "packages", request)
// //   //   try {
// //   //     console.log(pkg, parent)
// //   //     return _load.call(pkg, parent)
// //   //   }
// //   //   catch (err2) {
// //   //     throw err
// //   //   }
// //   //   // console.log(err)
// //   //   // var pkg = path.replace("@cypress/", "")
// //   //   // console.log(pkg)
// //   //   // return req.call(this, `./packages/${path}`)
// //   // }
// // }

// // Module.prototype.require = (path) => {
// //   try {
// //     return req.call(this, path)
// //   }
// //   catch (err) {
// //     // var pkg = path.replace("@cypress/", "")
// //     // console.log(pkg)
// //     return req.call(this, `./packages/${path}`)
// //   }
// // }

// // const req = (pkg) => {
// //   try {
// //     return require(pkg)
// //   }
// //   catch (err) {
// //     var pkg = pkg.replace("@cypress/", "")
// //     return require(`./packages/${pkg}`)
// //   }
// // }

// const server = require("@cypress/core-server")

// console.log(server())

// // console.log(require("foo"))