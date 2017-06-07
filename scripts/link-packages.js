/* eslint-disable no-console */

const fse = require('fs-extra')
const path = require('path')
const globber = require('glob')
const Promise = require('bluebird')

const fs = Promise.promisifyAll(fse)
const glob = Promise.promisify(globber)

const pathToPackages = path.join('node_modules', '@')

// glob all of the names of packages
glob('./packages/*')
.map((folder) => {
  // strip off the initial './'
  // ./packages/foo -> node_modules/@packages/foo
  const dest = pathToPackages + folder.slice(2)

  console.log('symlinking', folder, '->', dest)

  return fs.ensureSymlinkAsync(folder, dest)
})
