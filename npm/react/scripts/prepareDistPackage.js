const fs = require('fs')
const path = require('path')
const mainPackageData = require('../package.json')

function run () {
  const distPackageData = JSON.stringify({
    ...mainPackageData,
    scripts: undefined,
    standard: undefined,
    devDependencies: undefined,
    main: './index.js',
  }, null, 2)

  fs.writeFileSync(
    path.resolve(__dirname, '..', 'dist', 'package.json'),
    distPackageData,
  )
}

run()
