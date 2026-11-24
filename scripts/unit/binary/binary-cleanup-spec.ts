import '../../spec-helper'
import { expect } from 'chai'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'

const { createExactCaseChecker } = require('../../binary/binary-cleanup')

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
})
