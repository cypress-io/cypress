import { expect } from 'chai'
import { execFileSync, spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

const repoRoot = path.join(__dirname, '..', '..')
const script = path.join(repoRoot, '.circleci', 'scripts', 'generate-pipeline-parameters.sh')

const readPackageJson = (dir: string) => JSON.parse(fs.readFileSync(path.join(repoRoot, dir, 'package.json'), 'utf8'))

// `--scope=cypress --scope @packages/{a,b}` becomes `['cypress', '@packages/a', '@packages/b']`
const rootTestScopes = (): string[] => {
  const { scripts } = readPackageJson('.')

  return [...scripts.test.matchAll(/--scope[= ](\S+)/g)].flatMap(([, scope]) => {
    const braces = scope.match(/^([^{]*)\{([^}]*)\}$/)

    return braces ? braces[2].split(',').map((name) => `${braces[1]}${name}`) : [scope]
  })
}

const workspaceDirsByName = (): Map<string, string> => {
  const { workspaces } = readPackageJson('.')

  return new Map(workspaces.packages
  .flatMap((pattern: string) => fs.globSync(`${pattern}/package.json`, { cwd: repoRoot }))
  .map((pkgPath: string) => {
    const dir = path.dirname(pkgPath)

    return [readPackageJson(dir).name, dir]
  }))
}

// Drops inherited GIT_* variables, which a git hook sets and which would point
// these commands at the caller's repository, and ignores the caller's git
// config, so commit signing or global hooks can't fail the scratch commits.
const isolatedEnv = (): NodeJS.ProcessEnv => {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')))

  return { ...env, GIT_CONFIG_GLOBAL: os.devNull, GIT_CONFIG_NOSYSTEM: '1' }
}

const git = (cwd: string, ...args: string[]) => {
  execFileSync('git', ['-c', 'user.name=Jordan Avery', '-c', 'user.email=jordan.avery@example.com', ...args], { cwd, env: isolatedEnv(), stdio: 'ignore' })
}

// Runs the script the way a webhook push to develop does, so it diffs against
// HEAD~1 and never fetches from GitHub.
const parametersForChange = (changedFile: string) => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'pipeline-params-'))

  try {
    git(cwd, 'init', '-q')
    git(cwd, 'commit', '-q', '--allow-empty', '-m', 'base')
    fs.mkdirSync(path.join(cwd, path.dirname(changedFile)), { recursive: true })
    fs.writeFileSync(path.join(cwd, changedFile), 'export {}\n')
    git(cwd, 'add', '.')
    git(cwd, 'commit', '-q', '-m', 'change')

    const { status, stdout, stderr } = spawnSync('bash', [script], {
      cwd,
      encoding: 'utf8',
      env: { ...isolatedEnv(), CIRCLE_BRANCH: 'develop', TRIGGER_SOURCE: 'webhook', BASE_REVISION: '', RUN_ALL_JOBS: 'false' },
    })

    expect(status, stderr).to.equal(0)

    return { parameters: JSON.parse(stdout), stderr }
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true })
  }
}

// NOTE: CircleCI only runs this script on Linux, but windows-unit-tests also
// picks up this spec, where `bash` may be WSL's and the script may have CRLF
// line endings.
const describeOnPosix = process.platform === 'win32' ? describe.skip : describe

describeOnPosix('generate-pipeline-parameters.sh', () => {
  // A scope that isn't a real workspace name, such as an unexpanded
  // `@packages/{a,b}`, fails the next test, so this only has to catch the
  // parser finding nothing at all.
  it('finds the workspaces the root test script covers', () => {
    expect(rootTestScopes()).to.not.be.empty
  })

  // The unit-tests job runs the root `yarn test`, so a change to any workspace
  // it covers has to turn that job on. Otherwise the change merges untested and
  // fails first in the scheduled develop run, which turns everything on.
  it('runs unit-tests for a change to every workspace the root test script covers', () => {
    const dirs = workspaceDirsByName()

    const missing = rootTestScopes().filter((name) => {
      const dir = dirs.get(name)

      expect(dir, `no workspace named ${name}`).to.be.a('string')

      const { parameters, stderr } = parametersForChange(`${dir}/test/unit/example.spec.ts`)

      // A push falls back to running everything for an unmapped path, which
      // would turn unit-tests on without the mapping doing it.
      return parameters['run-unit-tests'] !== true || stderr.includes('unrecognized path')
    })

    expect(missing, `set unit_tests=true in generate-pipeline-parameters.sh for: ${missing.join(', ')}`).to.be.empty
  }).timeout(60000)
})
