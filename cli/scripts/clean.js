const fs = require('fs-extra')
const path = require('path')
const { includeTypes } = require('./utils')

fs.removeSync(path.join(__dirname, '..', 'build'))
fs.removeSync(path.join(__dirname, '..', 'angular'))
fs.removeSync(path.join(__dirname, '..', 'mount-utils'))
fs.removeSync(path.join(__dirname, '..', 'react'))
fs.removeSync(path.join(__dirname, '..', 'react18'))
fs.removeSync(path.join(__dirname, '..', 'vue'))
fs.removeSync(path.join(__dirname, '..', 'vue2'))
fs.removeSync(path.join(__dirname, '..', 'svelte'))

includeTypes.forEach((folder) => {
  try {
    fs.removeSync(path.join(__dirname, '..', 'types', folder))
  } catch (e) {
    //
  }
})
