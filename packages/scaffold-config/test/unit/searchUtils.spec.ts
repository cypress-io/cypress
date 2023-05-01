import fs from 'fs-extra'
import path from 'path'
import { expect } from 'chai'
import os from 'os'
import { isRepositoryRoot, tryToFindPnpFile } from '../../src/searchUtils'
import dedent from 'dedent'

const TEMP_DIR = path.join(os.tmpdir(), 'is-repository-root-tmp')

beforeEach(async () => {
  await fs.mkdir(TEMP_DIR)
})

afterEach(async () => {
  await fs.rm(TEMP_DIR, { recursive: true })
})

describe('isRepositoryRoot', () => {
  it('returns false if there is nothing in the directory', async () => {
    const isCurrentRepositoryRoot = await isRepositoryRoot(TEMP_DIR)

    expect(isCurrentRepositoryRoot).to.be.false
  })

  it('returns true if there is a Git directory', async () => {
    await fs.mkdir(path.join(TEMP_DIR, '.git'))

    const isCurrentRepositoryRoot = await isRepositoryRoot(TEMP_DIR)

    expect(isCurrentRepositoryRoot).to.be.true
  })

  it('returns false if there is a package.json without workspaces field', async () => {
    await fs.writeFile(path.join(TEMP_DIR, 'package.json'), `{
      "name": "@packages/foo",
      "private": true,
      "version": "1.0.0",
      "main": "index.js",
      "license": "MIT"
    }
    `)

    const isCurrentRepositoryRoot = await isRepositoryRoot(TEMP_DIR)

    expect(isCurrentRepositoryRoot).to.be.false
  })

  it('returns true if there is a package.json with workspaces field', async () => {
    await fs.writeFile(path.join(TEMP_DIR, 'package.json'), `{
        "name": "monorepo-repo",
        "private": true,
        "version": "1.0.0",
        "main": "index.js",
        "license": "MIT",
        "workspaces": [
          "packages/*"
        ]
      }
    `)

    const isCurrentRepositoryRoot = await isRepositoryRoot(TEMP_DIR)

    expect(isCurrentRepositoryRoot).to.be.true
  })
})

describe('tryToFindPnpFile', () => {
  it('finds pnp.cjs at repo root', async () => {
    const projectPath = path.join(TEMP_DIR, 'packages', 'tests')
    const pnpcjs = path.join(TEMP_DIR, '.pnp.cjs')

    await Promise.all([
      fs.ensureFile(path.join(projectPath, 'package.json')),
      fs.writeFile(pnpcjs, '/* pnp api */'),
      fs.writeFile(path.join(TEMP_DIR, 'package.json'), dedent`
      {
        "workspaces": [
          "packages/*"
        ]
      }
    `),
    ])

    const pnpPath = await tryToFindPnpFile(projectPath)

    expect(pnpPath).to.eq(pnpcjs)
  })

  it('does not find pnp.cjs at repo root', async () => {
    const projectPath = path.join(TEMP_DIR, 'packages', 'tests')

    await fs.ensureFile(path.join(projectPath, 'package.json'))
    await fs.writeFile(path.join(TEMP_DIR, 'package.json'), dedent`
    {
      "workspaces": [
        "packages/*"
      ]
    }
  `)

    const pnpPath = await tryToFindPnpFile(projectPath)

    expect(pnpPath).to.eq(undefined)
  })
})
