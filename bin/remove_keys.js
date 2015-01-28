#!/usr/bin/env node

var Promise = require('bluebird');
var path    = require('path');
var glob    = require('glob');
var fs      = Promise.promisifyAll(require('fs'));
var basePath= process.argv[2];
var matcher = new RegExp(/\s+\[.*\]('|")/g)

if (!basePath) {
  console.log("pass a path to your cy project");
  process.exit(1);
}

fs.readFileAsync(path.join(basePath, 'eclectus.json'), 'utf8')
.then(JSON.parse)
.then(function(d) {
  return path.resolve(path.join(basePath, '/', d.eclectus.testFolder))
})
.then(function(testFolderPath) {
  return new Promise(function(res, rej) {
    glob(testFolderPath + "/**/*+(.js|.coffee)", function(er, files) {
      if (er) {
        return rej(er)
      }

      res(files);
    })
  });
})
.map(function(file) {
  fs.readFileAsync(file, 'utf8')
  .then(function(contents) {
    return fs.writeFileAsync(file, contents.replace(matcher, function(a, b) { return b }));
  })
})
.then(function() {
  console.log("all done")
})
