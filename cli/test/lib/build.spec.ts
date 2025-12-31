import { vi, describe, it, beforeEach, expect } from 'vitest'
import fs from 'fs-extra'
import semver from 'semver'
import makeUserPackageFile from '../../scripts/prepare-package-json'

vi.mock('fs-extra', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      readJson: vi.fn(),
      outputJson: vi.fn(),
    },
  }
})

describe('package.json build', () => {
  beforeEach(function (): void {
    // stub package.json in CLI
    // with a few test props
    // the rest should come from root package.json file

    vi.mocked(fs.readJson).mockResolvedValue({
      name: 'test',
      engines: 'test engines',
    } as any)

    vi.mocked(fs.outputJson).mockResolvedValue(undefined)
  })

  it('has a semver version', async () => {
    const result = await makeUserPackageFile()

    expect(semver.valid(result.version)).toBeTruthy()
  })

  it('outputs expected properties', async () => {
    const result = await makeUserPackageFile()

    expect(result.buildInfo).to.include({ stable: false })
    expect(result.buildInfo.commitBranch).to.match(/.+/)
    expect(result.buildInfo.commitSha).to.match(/[a-f0-9]+/)

    const snapshot = {
      ...result,
      version: 'x.y.z',
      buildInfo: 'replaced by normalizePackageJson',
    }

    expect(snapshot).toMatchSnapshot()
  })
})
