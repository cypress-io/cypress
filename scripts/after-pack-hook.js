/* eslint-disable no-console */
const fs = require('fs-extra')
const { join } = require('path')
const globby = require('globby')
const os = require('os')

module.exports = async function (params) {
  console.log('****************************')
  console.log('After pack hook')
  console.log(params.appOutDir)
  console.log(params.outDir)
  console.log(params.electronPlatformName)
  console.log('****************************')

  const packages = await globby(['packages/*/node_modules'], {
    cwd: params.packager.info._appDir,
    onlyFiles: false,
  })

  const buildSubfoldersPerPlatform = {
    darwin: join('Cypress.app', 'Contents', 'Resources', 'app'),
    linux: join('resources', 'app'),
    win32: join('resources', 'app'), // TODO check this path
  }
  const buildSubfolder = buildSubfoldersPerPlatform[os.platform()]
  const outputFolder = join(params.appOutDir, buildSubfolder)

  console.log('copying node_modules to', outputFolder)

  for await (const packageNodeModules of packages) {
    console.log('copying', packageNodeModules)

    const sourceFolder = join(params.packager.info._appDir, packageNodeModules)
    const destinationFolder = join(outputFolder, packageNodeModules)

    await fs.copy(sourceFolder, destinationFolder)
  }

  console.log('all node_modules subfolders copied to', outputFolder)
}
