/* eslint-disable no-console */
const fs = require('fs-extra')
const { join } = require('path')
const globby = require('globby')

module.exports = async function (params) {
  console.log('****************************')
  console.log('After pack hook')
  console.log(params)
  console.log(params.packager.info.nodeDependencyInfo)
  console.log('****************************')

  const packages = await globby(['packages/*/node_modules'], {
    cwd: params.packager.info._appDir,
    onlyFiles: false,
  })

  packages.forEach(async (packageNodeModules) => {
    console.log('copying', packageNodeModules)

    const sourceFolder = join(params.packager.info._appDir, packageNodeModules)
    const destinationFolder = join(params.appOutDir, 'Cypress.app', 'Contents', 'Resources', 'app', packageNodeModules)

    await fs.copy(sourceFolder, destinationFolder)
  })
}
