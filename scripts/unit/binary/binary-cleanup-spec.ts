import '../../spec-helper'
import { expect } from 'chai'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'

const { createExactCaseChecker, removeBundledDependencies } = require('../../binary/binary-cleanup')

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

  context('removeBundledDependencies', () => {
    // getDependencyPathsToKeep always bundles these, so they have to exist
    const alwaysKeptEntryPoints = [
      'packages/server/lib/plugins/child/require_async_child.js',
      'packages/server/node_modules/@cypress/webpack-batteries-included-preprocessor/dist/index.js',
      'packages/server/node_modules/ts-loader/index.js',
      'npm/webpack-batteries-included-preprocessor/dist/index.js',
      'node_modules/tsx/dist/cjs/index.cjs',
      'node_modules/tsx/dist/loader.mjs',
      'node_modules/tslib/tslib.js',
      'node_modules/esbuild/lib/main.js',
      'node_modules/find-up/index.js',
      'node_modules/webpack/lib/webpack.js',
      'node_modules/webpack-dev-server/lib/Server.js',
      'node_modules/html-webpack-plugin-5/index.js',
      'node_modules/mocha-7.2.0/index.js',
      'packages/server/node_modules/webdriver/build/index.js',
      'packages/server/node_modules/@wdio/utils/build/node.js',
      'node_modules/jimp/dist/commonjs/index.js',
      'node_modules/pump/index.js',
      'node_modules/sprintf-js/src/sprintf.js',
      'node_modules/esutils/lib/utils.js',
      'node_modules/through/index.js',
      'node_modules/string-width/index.js',
      'node_modules/proxy-from-env/index.js',
      'node_modules/better-sqlite3/lib/index.js',
    ]

    let buildAppDir: string

    const exists = (relativePath: string) => fs.pathExists(path.join(buildAppDir, relativePath))

    beforeEach(async () => {
      buildAppDir = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'binary-cleanup-')))

      await Promise.all(alwaysKeptEntryPoints.map((entryPoint) => fs.outputFile(path.join(buildAppDir, entryPoint), '')))
      await fs.outputFile(path.join(buildAppDir, 'node_modules', 'lodash', 'lodash.js'), 'module.exports = {}')
    })

    afterEach(async () => {
      await fs.remove(buildAppDir)
    })

    it('keeps the dependencies of a .js file loaded from disk', async () => {
      await fs.outputFile(path.join(buildAppDir, 'node_modules', '@cypress', 'request-promise', 'lib', 'rp.js'), `module.exports = require('request-promise-core/configure/request2')`)
      await fs.outputFile(path.join(buildAppDir, 'node_modules', 'request-promise-core', 'configure', 'request2.js'), 'module.exports = () => {}')

      await removeBundledDependencies(buildAppDir, {
        bundledDependencies: ['./node_modules/request-promise-core/configure/request2.js', './node_modules/lodash/lodash.js'],
        loadedFromDisk: ['node_modules/@cypress/request-promise/lib/rp.js'],
      })

      expect(await exists('node_modules/request-promise-core/configure/request2.js')).to.be.true
      expect(await exists('node_modules/lodash/lodash.js')).to.be.false
    })

    it('keeps the dependencies of a .cjs file loaded from disk', async () => {
      await fs.outputFile(path.join(buildAppDir, 'node_modules', 'tsx', 'dist', 'preflight.cjs'), `module.exports = require('get-tsconfig')`)
      await fs.outputFile(path.join(buildAppDir, 'node_modules', 'get-tsconfig', 'index.js'), 'module.exports = () => {}')

      await removeBundledDependencies(buildAppDir, {
        bundledDependencies: ['./node_modules/get-tsconfig/index.js', './node_modules/lodash/lodash.js'],
        loadedFromDisk: ['node_modules/tsx/dist/preflight.cjs'],
      })

      expect(await exists('node_modules/tsx/dist/preflight.cjs')).to.be.true
      expect(await exists('node_modules/get-tsconfig/index.js')).to.be.true
      expect(await exists('node_modules/lodash/lodash.js')).to.be.false
    })

    it('keeps a reporter loaded from disk that requires mocha', async () => {
      await fs.outputFile(path.join(buildAppDir, 'node_modules', 'mocha-junit-reporter', 'index.js'), `var Base = require('mocha').reporters.Base\nrequire.resolve('mocha')\nrequire('mocha/lib/stats-collector')\nmodule.exports = require('xml')`)
      await fs.outputFile(path.join(buildAppDir, 'node_modules', 'xml', 'lib', 'xml.js'), 'module.exports = () => {}')
      await fs.outputJson(path.join(buildAppDir, 'node_modules', 'xml', 'package.json'), { main: 'lib/xml.js' })

      await removeBundledDependencies(buildAppDir, {
        bundledDependencies: ['./node_modules/xml/lib/xml.js', './node_modules/lodash/lodash.js'],
        loadedFromDisk: ['node_modules/mocha-junit-reporter/index.js'],
      })

      expect(await exists('node_modules/mocha-junit-reporter/index.js')).to.be.true
      expect(await exists('node_modules/xml/lib/xml.js')).to.be.true
      expect(await exists('node_modules/lodash/lodash.js')).to.be.false
    })
  })
})
