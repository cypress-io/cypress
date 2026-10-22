import { expect } from 'chai'
import fs from 'fs'
import path from 'path'

const repoRoot = path.join(__dirname, '..', '..')

const readPackageJson = (dir: string) => JSON.parse(fs.readFileSync(path.join(repoRoot, dir, 'package.json'), 'utf8'))

const flatConfigWorkspaces = (): string[] => {
  const { workspaces } = readPackageJson('.')

  return workspaces.packages
  .flatMap((pattern: string) => fs.globSync(`${pattern}/eslint.config.*`, { cwd: repoRoot }))
  .map((configPath: string) => path.dirname(configPath))
}

describe('lint-staged', () => {
  it('finds the flat-config workspaces', () => {
    expect(flatConfigWorkspaces()).to.include.members(['cli', 'packages/server', 'npm/vue'])
  })

  // lint-staged hands a file to the nearest package.json with a `lint-staged`
  // key. Without one, a flat-config workspace falls through to the root config
  // and is linted by ESLint 8 against `.eslintrc.js`.
  it('gives every flat-config workspace its own lint-staged config', () => {
    const missing = flatConfigWorkspaces().filter((dir) => !readPackageJson(dir)['lint-staged'])

    expect(missing, 'add a "lint-staged" key to these package.json files').to.be.empty
  })
})
