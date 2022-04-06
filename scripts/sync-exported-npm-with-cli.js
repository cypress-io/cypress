/**
 * This script is used to re-export packages that Cypress publishes on its own.
 * It is executed individually in a postbuild step by individual npm/* packages.
 * For example, usually, Cypress will publish the `npm/react` directory as a `@cypress/react` package.
 * However, the Cypress binary will also ship an export for `cypress/react` that's guaranteed to work
 * with this version of the binary
 */
const shell = require('shelljs')
const path = require('path')
const packlist = require('npm-packlist')
const fs = require('fs')

// 1. Get the full path to the cli where Cypress's package.json is defined
const cliPath = path.join(__dirname, '..', 'cli')
const cliPackageConfig = require(path.join(cliPath, 'package.json'))

// 2. This script will be run in a postbuild task for each npm package
// that will be re-exported by Cypress
const currentPackageDir = process.cwd()
const currentPackageConfig = require(path.join(process.cwd(), 'package.json'))

// Typically, these packages are independently published as @cypress/package-name
// e.g. @cypress/vue => import whatever from 'cypress/vue'
// The files will wind up at cypress/cli/vue/*
const exportName = currentPackageConfig.name.replace('@cypress/', '')
const outDir = path.join(cliPath, exportName)

// 3. We'll run npm's own "packlist" to make sure we don't miss any files
// that are defined as exported in the package.json['files'] key
packlist({ path: currentPackageDir })
.then((files) => {
  files.forEach(async (f) => {
    // mkdir if not exists
    const { dir } = path.parse(f)

    if (dir) {
      shell.mkdir('-p', path.join(outDir, dir))
    }

    await shell.cp(path.join(currentPackageDir, f), path.join(outDir, f))
  })

  // After everything is copied, let's update the Cypress cli package.json['exports'] option
  // Now, we'll construct the exports map, using the module and main exports.
  const isModule = cliPackageConfig.type === 'module'
  const subPackageExports = cliPackageConfig.exports[`./${exportName}`] = {}
  const esmEntry = isModule ? currentPackageConfig.main : currentPackageConfig.module

  if (esmEntry) {
    subPackageExports.import = `./${exportName}/${esmEntry}`
  }

  if (!isModule) {
    subPackageExports.require = `./${exportName}/${currentPackageConfig.main}`
  }

  if (cliPackageConfig.files.indexOf(exportName) === -1) {
    cliPackageConfig.files.push(exportName)
  }

  const output = JSON.stringify(cliPackageConfig, null, 2)

  fs.writeFileSync(path.join(cliPath, 'package.json'), output, 'utf-8')
})
