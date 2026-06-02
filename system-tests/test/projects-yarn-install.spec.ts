import path from 'path'
import fs from 'fs-extra'
import { expect } from 'chai'
import { isWorkspacePackage } from '../lib/is-workspace-package'

describe('projects-yarn-install workspace package detection', () => {
  const projectsDir = path.join(__dirname, '../projects')

  it('should detect bun-workspace packages as workspace packages', async () => {
    // Test that workspace packages are detected correctly
    const workspacePackageDir = path.join(projectsDir, 'bun-workspace/packages/app')
    const result = await isWorkspacePackage(workspacePackageDir, projectsDir)

    expect(result).to.be.true
  })

  it('should detect bun-workspace shared package as workspace package', async () => {
    const workspacePackageDir = path.join(projectsDir, 'bun-workspace/packages/shared')
    const result = await isWorkspacePackage(workspacePackageDir, projectsDir)

    expect(result).to.be.true
  })

  it('should not detect bun-workspace root as workspace package', async () => {
    // The root workspace directory should not be detected as a workspace package
    const workspaceRootDir = path.join(projectsDir, 'bun-workspace')
    const result = await isWorkspacePackage(workspaceRootDir, projectsDir)

    expect(result).to.be.false
  })

  it('should not detect regular projects as workspace packages', async () => {
    // Regular projects without parent lockfiles should not be detected as workspace packages
    const regularProjectDir = path.join(projectsDir, 'bun-with-deps')
    const result = await isWorkspacePackage(regularProjectDir, projectsDir)

    expect(result).to.be.false
  })

  it('should detect workspace packages with yarn.lock in parent', async () => {
    // Create a temporary test structure
    const testDir = path.join(__dirname, '../tmp-test-workspace')
    const workspaceRoot = path.join(testDir, 'test-workspace')
    const workspacePackage = path.join(workspaceRoot, 'packages/app')

    try {
      await fs.ensureDir(workspacePackage)
      await fs.writeFile(path.join(workspaceRoot, 'yarn.lock'), 'test lockfile')
      await fs.writeFile(path.join(workspacePackage, 'package.json'), '{}')

      const result = await isWorkspacePackage(workspacePackage, testDir)

      expect(result).to.be.true
    } finally {
      await fs.remove(testDir).catch(() => {})
    }
  })

  it('should detect workspace packages with package-lock.json in parent', async () => {
    const testDir = path.join(__dirname, '../tmp-test-workspace')
    const workspaceRoot = path.join(testDir, 'test-workspace')
    const workspacePackage = path.join(workspaceRoot, 'packages/app')

    try {
      await fs.ensureDir(workspacePackage)
      await fs.writeFile(path.join(workspaceRoot, 'package-lock.json'), '{}')
      await fs.writeFile(path.join(workspacePackage, 'package.json'), '{}')

      const result = await isWorkspacePackage(workspacePackage, testDir)

      expect(result).to.be.true
    } finally {
      await fs.remove(testDir).catch(() => {})
    }
  })

  it('should detect workspace packages with pnpm-lock.yaml in parent', async () => {
    const testDir = path.join(__dirname, '../tmp-test-workspace')
    const workspaceRoot = path.join(testDir, 'test-workspace')
    const workspacePackage = path.join(workspaceRoot, 'packages/app')

    try {
      await fs.ensureDir(workspacePackage)
      await fs.writeFile(path.join(workspaceRoot, 'pnpm-lock.yaml'), 'test lockfile')
      await fs.writeFile(path.join(workspacePackage, 'package.json'), '{}')

      const result = await isWorkspacePackage(workspacePackage, testDir)

      expect(result).to.be.true
    } finally {
      await fs.remove(testDir).catch(() => {})
    }
  })
})
