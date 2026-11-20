import '../../spec-helper'
import { expect } from 'chai'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'

const { validateShippedServerCode } = require('../../binary/binary-sources')

const TEST_KEY = 'TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF0ZXN0'

describe('binary-sources', () => {
  context('validateShippedServerCode', () => {
    let serverDir: string

    beforeEach(async () => {
      serverDir = await fs.mkdtemp(path.join(os.tmpdir(), 'binary-sources-'))
      await fs.outputFile(path.join(serverDir, 'start-cypress.bundle.js'), `const studioUrl = 'https://cloud.cypress.io/studio'`)
    })

    afterEach(async () => {
      await fs.remove(serverDir)
    })

    it('passes when no shipped file reads a local override', async () => {
      await validateShippedServerCode(serverDir, TEST_KEY)
    })

    it('names each file and variable that is left', async () => {
      await fs.outputFile(path.join(serverDir, 'lib', 'project-base.js'), `if (process.env.CYPRESS_LOCAL_CY_PROMPT_PATH) {}`)
      await fs.outputFile(path.join(serverDir, 'start-cypress.bundle.js'), `const p = process.env.CYPRESS_LOCAL_STUDIO_PATH`)

      const error = await validateShippedServerCode(serverDir, TEST_KEY).catch((err: Error) => err)

      expect(error).to.be.an('error')
      expect(error.message).to.include('lib/project-base.js reads CYPRESS_LOCAL_CY_PROMPT_PATH')
      expect(error.message).to.include('start-cypress.bundle.js reads CYPRESS_LOCAL_STUDIO_PATH')
    })

    it('fails when the test encryption key is shipped', async () => {
      await fs.outputFile(path.join(serverDir, 'index.js'), `const keys = { test: \`${TEST_KEY}\` }`)

      const error = await validateShippedServerCode(serverDir, TEST_KEY).catch((err: Error) => err)

      expect(error).to.be.an('error')
      expect(error.message).to.include('index.js contains the test encryption key')
    })

    it('fails when a bundle contains a character above U+00FF', async () => {
      await fs.outputFile(path.join(serverDir, 'start-cypress.bundle.js'), 'const invalidPathRegex = /[‘“!%&^<=>`]/')

      const error = await validateShippedServerCode(serverDir, TEST_KEY).catch((err: Error) => err)

      expect(error).to.be.an('error')
      expect(error.message).to.include('start-cypress.bundle.js contains U+2018, so V8 stores it as two-byte')
    })

    it('allows Latin-1 characters in a bundle and any character in other files', async () => {
      await fs.outputFile(path.join(serverDir, 'index.js'), 'const SEXAGESIMAL_REGEX = /^([0-9]{1,3})°/')
      await fs.outputFile(path.join(serverDir, 'lib', 'util', 'quotes.js'), 'module.exports = /[‘“]/')

      await validateShippedServerCode(serverDir, TEST_KEY)
    })

    it('ignores dependencies under node_modules', async () => {
      await fs.outputFile(path.join(serverDir, 'node_modules', 'some-package', 'index.js'), `process.env.CYPRESS_LOCAL_PROTOCOL_PATH`)

      await validateShippedServerCode(serverDir, TEST_KEY)
    })

    it('reads the test key from cloud/encryption.ts by default', async () => {
      const encryptionSource = await fs.readFile(path.join(__dirname, '../../../packages/server/lib/cloud/encryption.ts'), 'utf8')
      const testKey = encryptionSource.match(/const CY_TEST = `(.*?)`/)?.[1]

      await fs.outputFile(path.join(serverDir, 'lib', 'cloud', 'encryption.js'), `const CY_TEST = \`${testKey}\``)

      const error = await validateShippedServerCode(serverDir).catch((err: Error) => err)

      expect(error).to.be.an('error')
      expect(error.message).to.include('lib/cloud/encryption.js contains the test encryption key')
    })
  })
})
