import { describe, expect, it, beforeEach, afterEach } from '@jest/globals'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import { shouldLoadConfigAsEsm } from '../../../src/util/shouldLoadConfigAsEsm'

describe('shouldLoadConfigAsEsm', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cypress-config-module-type-'))
  })

  afterEach(async () => {
    await fs.remove(tmpDir)
  })

  it('loads .mjs as esm regardless of package.json type', async () => {
    await fs.writeJson(path.join(tmpDir, 'package.json'), { type: 'commonjs' })
    const configPath = path.join(tmpDir, 'cypress.config.mjs')

    await fs.writeFile(configPath, 'export default {}')

    expect(shouldLoadConfigAsEsm(configPath)).toBe(true)
  })

  it('loads .mts as esm regardless of package.json type', async () => {
    await fs.writeJson(path.join(tmpDir, 'package.json'), { type: 'commonjs' })
    const configPath = path.join(tmpDir, 'cypress.config.mts')

    await fs.writeFile(configPath, 'export default {}')

    expect(shouldLoadConfigAsEsm(configPath)).toBe(true)
  })

  it('loads .cjs as cjs regardless of package.json type', async () => {
    await fs.writeJson(path.join(tmpDir, 'package.json'), { type: 'module' })
    const configPath = path.join(tmpDir, 'cypress.config.cjs')

    await fs.writeFile(configPath, 'module.exports = {}')

    expect(shouldLoadConfigAsEsm(configPath)).toBe(false)
  })

  it('loads .cts as cjs regardless of package.json type', async () => {
    await fs.writeJson(path.join(tmpDir, 'package.json'), { type: 'module' })
    const configPath = path.join(tmpDir, 'cypress.config.cts')

    await fs.writeFile(configPath, 'export default {}')

    expect(shouldLoadConfigAsEsm(configPath)).toBe(false)
  })

  it('loads .js as esm when nearest package.json has type module', async () => {
    await fs.writeJson(path.join(tmpDir, 'package.json'), { type: 'module' })
    const configPath = path.join(tmpDir, 'cypress.config.js')

    await fs.writeFile(configPath, 'export default {}')

    expect(shouldLoadConfigAsEsm(configPath)).toBe(true)
  })

  it('loads .js as cjs when nearest package.json has no type field', async () => {
    await fs.writeJson(path.join(tmpDir, 'package.json'), { name: 'example' })
    const configPath = path.join(tmpDir, 'cypress.config.js')

    await fs.writeFile(configPath, 'module.exports = {}')

    expect(shouldLoadConfigAsEsm(configPath)).toBe(false)
  })

  it('loads .ts using nearest package.json type', async () => {
    await fs.writeJson(path.join(tmpDir, 'package.json'), { type: 'module' })
    const configPath = path.join(tmpDir, 'cypress.config.ts')

    await fs.writeFile(configPath, 'export default {}')

    expect(shouldLoadConfigAsEsm(configPath)).toBe(true)
  })

  it('uses the nearest package.json when config is nested', async () => {
    const nestedDir = path.join(tmpDir, 'nested')

    await fs.mkdir(nestedDir)
    await fs.writeJson(path.join(tmpDir, 'package.json'), { type: 'module' })
    await fs.writeJson(path.join(nestedDir, 'package.json'), { type: 'commonjs' })

    const configPath = path.join(nestedDir, 'cypress.config.js')

    await fs.writeFile(configPath, 'module.exports = {}')

    expect(shouldLoadConfigAsEsm(configPath)).toBe(false)
  })
})
