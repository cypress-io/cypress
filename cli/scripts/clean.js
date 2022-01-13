const fs = require('fs-extra')
const path = require('path')
const { includeTypes } = require('./utils')

fs.removeSync(path.join(__dirname, '..', 'build'))

includeTypes.forEach((folder) => {
  try {
    fs.removeSync(path.join(__dirname, '..', 'types', folder))
  } catch (e) {
    //
  }
})
