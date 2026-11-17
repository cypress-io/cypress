import '../../spec-helper'
import { expect } from 'chai'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'

const { createExactCaseChecker, createStartCypressBundle } = require('../../binary/binary-cleanup')

describe('binary-cleanup', () => {
  context('createExactCaseChecker', () => {
    let baseDir: string

    beforeEach(async () => {
      baseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'binary-cleanup-'))
      await fs.outputFile(path.join(baseDir, 'node_modules', 'mime', 'Mime.js'), '')
    })

    afterEach(async () => {
      await fs.remove(baseDir)
    })

    it('matches a path with the same case', async () => {
      const existsWithExactCase = createExactCaseChecker(baseDir)

      expect(await existsWithExactCase('./node_modules/mime/Mime.js')).to.be.true
    })

    it('does not match a file that differs only in case', async () => {
      const existsWithExactCase = createExactCaseChecker(baseDir)

      expect(await existsWithExactCase('./node_modules/mime/mime.js')).to.be.false
    })

    it('does not match a directory that differs only in case', async () => {
      const existsWithExactCase = createExactCaseChecker(baseDir)

      expect(await existsWithExactCase('./node_modules/MIME/Mime.js')).to.be.false
    })

    it('does not match a missing path', async () => {
      const existsWithExactCase = createExactCaseChecker(baseDir)

      expect(await existsWithExactCase('./packages/server/node_modules/mime/Mime.js')).to.be.false
    })
  })

  context('createStartCypressBundle', () => {
    let appDir: string
    let loadNodeAddon: NodeJS.RequireExtensions['.node']

    beforeEach(async () => {
      appDir = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'binary-cleanup-')))
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

    it('loads a native addon from the package that requires it', async () => {
      await createStartCypressBundle(appDir)

      expect(require(path.join(appDir, 'packages', 'server', 'start-cypress.bundle.js'))).to.equal(path.join(appDir, 'node_modules', 'addon-package', 'build', 'Release', 'addon.node'))
    })
  })
})
