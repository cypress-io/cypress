const fs = require('fs')
const path = require('path')

if (!fs.existsSync(path.resolve(__dirname, '../example/node_modules/webpack'))) {
  throw new Error(['This script needs "example" to be installed locally. Run the following commands before retrying.', '', 'cd example', 'yarn install'].join('\n'))
}
