const fs = require('fs')
const path = require('path')
const sass = require('node-sass')

module.exports = (on, config) => {
  on('task', {
    'render:scss' (filePath) {
      const fullPath = path.join(__dirname, '..', '..', filePath)
      const scssContents = fs.readFileSync(fullPath).toString()

      return sass.renderSync({ data: scssContents }).css.toString()
    },
  })
}
