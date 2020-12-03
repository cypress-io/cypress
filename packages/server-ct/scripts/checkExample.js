const fs = require('fs')
const path = require('path')

if (!fs.existsSync(path.resolve(__dirname, './examples/node_modules/@vue/cli-service'))) {
  throw new Error(['This script needs "example" to be installed locally. Run the following commands before retrying.', '', 'cd example', 'yarn install'].join('\n'))
}
