#!/usr/bin/env node

/**
 * The post-main-build.js script is run after all npm/* and packages/*
 * have successfully built.
 *
 * This script is responsible for building types from INTERNAL npm/* modules (@cypress/vue)
 * If you are looking for how Cypress generates types for external npm modules (JQuery)
 * that happens in post-local-install.js
 */
const { join } = require('path')
const globby = require('globby')
const fs = require('fs-extra')
const shell = require('shelljs')
const path = require('path')

const npmPkg = [
  'react',
  'vue',
  'mount-utils',
]

const externalPkg = {
  vue: [
    '@vue/test-utils',
  ],
}

npmPkg.forEach((pkg) => {
  fs.removeSync(join(__dirname, `../${pkg}`))
  const pluginDir = path.dirname(require.resolve(`@cypress/${pkg}/package.json`))
  const toCopy = globby.sync(['*.d.ts', '**/*.d.ts'], {
    cwd: path.join(pluginDir, 'dist'),
  })

  for (const file of toCopy) {
    const outputFileName = join(__dirname, '..', pkg, file)

    fs.copySync(
      path.join(pluginDir, 'dist', file),
      outputFileName,
    )

    shell.sed('-i', 'from \'@cypress/mount-utils\';', 'from \'../mount-utils\';', outputFileName)

    if (externalPkg[pkg]) {
      for (const external of externalPkg[pkg]) {
        shell.sed('-i', `from '${external}';`, `from './${external}';`, outputFileName)
      }
    }
  }

  if (externalPkg[pkg]) {
    for (const external of externalPkg[pkg]) {
      const externalPluginDir = path.dirname(require.resolve(require.resolve(`${external}/package.json`), {
        paths: [path.dirname(require.resolve(`@cypress/${pkg}/package.json`))],
      }))
      const toCopyExternal = globby.sync(['*.d.ts', '**/*.d.ts'], {
        cwd: path.join(externalPluginDir, 'dist'),
      })

      for (const file of toCopyExternal) {
        const outputFileName = join(__dirname, '..', pkg, external, file)

        fs.copySync(
          path.join(externalPluginDir, 'dist', file),
          outputFileName,
        )
      }
    }
  }
})
