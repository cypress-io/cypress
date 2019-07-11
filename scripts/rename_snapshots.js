const fs = require('fs-extra')
const glob = require('glob')
const Promise = require('bluebird')

const globAsync = Promise.promisify(glob)

globAsync('packages/*/__snapshots__/*.coffee')
.map((file) => {
  const renamed = `${file}.js`

  /* eslint-disable no-console */
  console.log('renaming', file, '->', renamed)

  return fs.rename(file, renamed)
})
