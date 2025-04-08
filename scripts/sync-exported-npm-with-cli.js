/**
 * This script is used to re-export packages that Cypress publishes on its own.
 * It is executed individually in a postbuild step by individual npm/* packages.
 * For example, usually, Cypress will publish the `npm/react` directory as a `@cypress/react` package.
 * However, the Cypress binary will also ship an export for `cypress/react` that's guaranteed to work
 * with this version of the binary
 */
const path = require('path')
const Arborist = require('@npmcli/arborist')
const packlist = require('npm-packlist')
const fs = require('fs-extra')

// This script will be run in a postbuild task for each npm package
// that will be re-exported by Cypress
const currentPackageDir = process.cwd()

// 1. We'll run npm's own "packlist" against the npm package to be published (@cypress/react, etc)
// to make sure we don't miss any files when we copy them over to the CLI package
// The files that will be returned here are the ones from @cypress/react's package.json['files'] key.
const arborist = new Arborist({ path: currentPackageDir })

arborist.loadActual().then((tree) => {
  packlist(tree)
  .then((files) => {
    // 2. Move all of the files that would be published under @cypress/react
    // to be copied under cli/react (drop the @cypress namespace)
    const cliPath = path.join(__dirname, '..', 'cli')

    // Typically, these packages are independently published as @cypress/package-name
    // e.g. @cypress/vue => import whatever from 'cypress/vue'
    // The files will wind up at cypress/cli/vue/*
    const currentPackageConfig = require(path.join(process.cwd(), 'package.json'))
    const exportName = currentPackageConfig.name.replace('@cypress/', '')
    const outDir = path.join(cliPath, exportName)

    // Remove output directory to clean up old files before building
    fs.removeSync(outDir)

    // 3. For each file, mkdir if not exists, and then copy the dist'd assets over
    // to write to the `cliPackageConfig` at the end
    files.forEach((f) => {
      // mkdir if not exists
      const { dir } = path.parse(f)

      if (dir) {
        fs.mkdirSync(path.join(outDir, dir), { recursive: true })
      }

      fs.cpSync(path.join(currentPackageDir, f), path.join(outDir, f))
    })

    // After everything is copied, let's update the Cypress cli package.json['exports'] map.
    const isModule = currentPackageConfig.type === 'module'
    const types = currentPackageConfig.types

    const cliPackageConfig = require(path.join(cliPath, 'package.json'))

    const subPackageExports = cliPackageConfig.exports[`./${exportName}`] = {}
    const esmEntry = isModule ? currentPackageConfig.main : currentPackageConfig.module

    if (types) {
      // ./react/dist/cypress-react-cjs.js, etc
      subPackageExports.types = `./${exportName}/${types}`
    }

    if (esmEntry) {
      // ./react/dist/cypress-react-esm.js, etc
      subPackageExports.import = `./${exportName}/${esmEntry}`
    }

    if (!isModule) {
      // ./react/dist/cypress-react-cjs.js, etc
      subPackageExports.require = `./${exportName}/${currentPackageConfig.main}`
    }

    if (!cliPackageConfig.files.includes(exportName)) {
      cliPackageConfig.files.push(exportName)
    }

    const output = `${JSON.stringify(cliPackageConfig, null, 2) }\n`

    console.log('Writing to CLI package.json for', exportName)

    fs.writeFileSync(path.join(cliPath, 'package.json'), output, 'utf-8')
  })
})
