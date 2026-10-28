import { vi, describe, it, beforeEach, expect } from 'vitest'
import fs from 'fs-extra'
import semver from 'semver'
import makeUserPackageFile from '../../scripts/prepare-package-json'
import { findPackageContentProblems, MAX_PACKAGE_FILES } from '../../scripts/check-package-contents'

vi.mock('fs-extra', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error - importActual returns unknown, so .default is untyped
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

describe('npm package contents', () => {
  const files = ['package.json', 'dist/index.js', 'react/package.json', 'react/dist/index.d.ts', 'types/lodash/index.d.ts']

  it('accepts a package under the file ceiling with no nested copies', () => {
    expect(findPackageContentProblems(files, 10)).toEqual([])
  })

  it('reports a package over the file ceiling', () => {
    expect(findPackageContentProblems(files, 4)).toEqual([
      'the package contains 5 files, more than the ceiling of 4',
    ])
  })

  it('reports a folder copied into an existing folder of the same name', () => {
    const [problem] = findPackageContentProblems([...files, 'react/react/package.json', 'vue/vue/dist/index.js'], 10)

    expect(problem).toContain('react/react/package.json')
    expect(problem).toContain('vue/vue/dist/index.js')
  })

  it('defaults the ceiling to MAX_PACKAGE_FILES', () => {
    expect(findPackageContentProblems(Array.from({ length: MAX_PACKAGE_FILES }, (_, i) => `dist/${i}.js`))).toEqual([])
    expect(findPackageContentProblems(Array.from({ length: MAX_PACKAGE_FILES + 1 }, (_, i) => `dist/${i}.js`))).toHaveLength(1)
  })
})
