import { expect } from 'chai'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { isDependencyInstalledByName } from '../../src/frameworks'

describe('frameworks', () => {
  describe('isDependencyInstalledByName', () => {
    const TEMP_DIR = path.join(os.tmpdir(), 'is-dependency-installed-by-name-tmp')
    const TEMP_NODE_MODULES = path.join(TEMP_DIR, 'node_modules')

    beforeEach(async () => {
      await fs.mkdir(TEMP_DIR)
      await fs.mkdir(TEMP_NODE_MODULES)
    })

    afterEach(async () => {
      await fs.rm(TEMP_DIR, { recursive: true })
    })

    it('returns null version if dependency is not found', async () => {
      const result = await isDependencyInstalledByName('my-dep', TEMP_DIR)

      expect(result).to.eql({ dependency: 'my-dep', detectedVersion: null })
    })

    it('returns null version if there is no version in the package file', async () => {
      await fs.mkdir(path.join(TEMP_NODE_MODULES, 'my-dep'))
      await fs.writeFile(path.join(TEMP_NODE_MODULES, 'my-dep', 'package.json'), `{
        "name": "my-dep",
        "private": false,
        "main": "index.js",
        "license": "MIT"
      }
      `)

      const result = await isDependencyInstalledByName('my-dep', TEMP_DIR)

      expect(result).to.eql({ dependency: 'my-dep', detectedVersion: null })
    })

    it('returns package version if it finds the dependency', async () => {
      await fs.mkdir(path.join(TEMP_NODE_MODULES, 'my-dep'))
      await fs.writeFile(path.join(TEMP_NODE_MODULES, 'my-dep', 'package.json'), `{
        "name": "my-dep",
        "private": false,
        "version": "1.2.3",
        "main": "index.js",
        "license": "MIT"
      }
      `)

      const result = await isDependencyInstalledByName('my-dep', TEMP_DIR)

      expect(result).to.eql({ dependency: 'my-dep', detectedVersion: '1.2.3' })
    })
  })
})
