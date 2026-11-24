import '../../spec-helper'
import { expect } from 'chai'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'

const { createServerEntryPointBundle, createStartCypressBundle } = require('../../binary/start-bundle')

describe('start-bundle', () => {
  context('createStartCypressBundle', () => {
    let appDir: string
    let loadNodeAddon: NodeJS.RequireExtensions['.node']

    beforeEach(async () => {
      appDir = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'start-bundle-')))
      await fs.outputFile(path.join(appDir, 'packages', 'server', 'start-cypress.js'), `module.exports = require('addon-package')`)
      await fs.outputJson(path.join(appDir, 'node_modules', 'addon-package', 'package.json'), { main: 'dist/lib/index.js' })
      await fs.outputFile(path.join(appDir, 'node_modules', 'addon-package', 'dist', 'lib', 'index.js'), `module.exports = require('../../build/Release/addon.node')`)
      await fs.outputFile(path.join(appDir, 'node_modules', 'addon-package', 'build', 'Release', 'addon.node'), '')

      loadNodeAddon = require.extensions['.node']
      require.extensions['.node'] = (addonModule, filename) => {
        addonModule.exports = filename
      }
    })

    afterEach(async () => {
      require.extensions['.node'] = loadNodeAddon
      await fs.remove(appDir)
    })

    it('loads @cypress/request-promise from disk', async () => {
      const requestPromisePath = path.join(appDir, 'node_modules', '@cypress', 'request-promise', 'index.js')

      await fs.outputFile(path.join(appDir, 'packages', 'server', 'start-cypress.js'), `module.exports = require('@cypress/request-promise')`)
      await fs.outputFile(requestPromisePath, `module.exports = __filename`)

      const { loadedFromDisk } = await createStartCypressBundle(appDir)

      expect(require(path.join(appDir, 'packages', 'server', 'start-cypress.bundle.js'))).to.equal(requestPromisePath)
      expect(loadedFromDisk).to.include('node_modules/@cypress/request-promise/index.js')
    })

    it('loads the copy of @cypress/request-promise that the requiring package resolves', async () => {
      const nestedPath = path.join(appDir, 'node_modules', 'consumer', 'node_modules', '@cypress', 'request-promise', 'index.js')

      await fs.outputFile(path.join(appDir, 'packages', 'server', 'start-cypress.js'), `module.exports = require('consumer')`)
      await fs.outputFile(path.join(appDir, 'node_modules', 'consumer', 'index.js'), `module.exports = require('@cypress/request-promise')`)
      await fs.outputFile(nestedPath, `module.exports = __filename`)
      await fs.outputFile(path.join(appDir, 'node_modules', '@cypress', 'request-promise', 'index.js'), `module.exports = __filename`)

      const { loadedFromDisk } = await createStartCypressBundle(appDir)

      expect(require(path.join(appDir, 'packages', 'server', 'start-cypress.bundle.js'))).to.equal(nestedPath)
      expect(loadedFromDisk).to.deep.equal(['node_modules/consumer/node_modules/@cypress/request-promise/index.js'])
    })

    it('keeps "use strict" in modules that use __dirname', async () => {
      await fs.outputFile(path.join(appDir, 'packages', 'server', 'start-cypress.js'), `module.exports = require('./lib/strict')`)
      await fs.outputFile(path.join(appDir, 'packages', 'server', 'lib', 'strict.js'), `#!/usr/bin/env node\n// header\n"use strict";\nmodule.exports = { dirname: __dirname, strict: (function () { return this })() === undefined }`)

      await createStartCypressBundle(appDir)

      expect(require(path.join(appDir, 'packages', 'server', 'start-cypress.bundle.js'))).to.deep.equal({ dirname: path.join(appDir, 'packages', 'server', 'lib'), strict: true })
    })

    it('resolves an aliased require.resolve from the module that calls it', async () => {
      await fs.outputFile(path.join(appDir, 'packages', 'server', 'start-cypress.js'), `module.exports = require('data-package')`)
      await fs.outputFile(path.join(appDir, 'node_modules', 'data-package', 'index.js'), `const resolve = require.resolve\nmodule.exports = resolve('./data.json')`)
      await fs.outputJson(path.join(appDir, 'node_modules', 'data-package', 'data.json'), {})

      await createStartCypressBundle(appDir)

      expect(require(path.join(appDir, 'packages', 'server', 'start-cypress.bundle.js'))).to.equal(path.join(appDir, 'node_modules', 'data-package', 'data.json'))
    })

    it('loads a native addon from the package that requires it', async () => {
      await createStartCypressBundle(appDir)

      expect(require(path.join(appDir, 'packages', 'server', 'start-cypress.bundle.js'))).to.equal(path.join(appDir, 'node_modules', 'addon-package', 'build', 'Release', 'addon.node'))
    })
  })

  context('createServerEntryPointBundle', () => {
    let appDir: string

    beforeEach(async () => {
      appDir = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'start-bundle-')))
      await fs.outputFile(path.join(appDir, 'packages', 'server', 'index.js'), `module.exports = require('./lib/helper') + require('./start-cypress')`)
      await fs.outputFile(path.join(appDir, 'packages', 'server', 'lib', 'helper.js'), `module.exports = 'helper:'`)
      await fs.outputFile(path.join(appDir, 'packages', 'server', 'start-cypress.js'), `module.exports = 'start-cypress'`)
    })

    afterEach(async () => {
      await fs.remove(appDir)
    })

    it('bundles index.js in place and leaves start-cypress out', async () => {
      const bundledDependencies = await createServerEntryPointBundle(appDir)

      await fs.remove(path.join(appDir, 'packages', 'server', 'lib', 'helper.js'))

      expect(require(path.join(appDir, 'packages', 'server', 'index.js'))).to.equal('helper:start-cypress')
      expect(bundledDependencies).to.deep.equal(['./packages/server/lib/helper.js'])
    })
  })
})
