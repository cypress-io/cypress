const { expect } = require('chai')
const { execSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const {
  assertRunAllJobsDefaultsFalse,
  getRunAllJobsDefault,
} = require('../circleci/pipeline-parameter-defaults')

const REPO_ROOT = path.join(__dirname, '../..')
const SCRIPT = path.join(REPO_ROOT, '.circleci/scripts/generate-pipeline-parameters.sh')
const SETUP_CONFIG = path.join(REPO_ROOT, '.circleci/config.yml')
const PRIMARY_CONFIG = path.join(REPO_ROOT, '.circleci/src/pipeline/@pipeline.yml')

function runGeneratePipelineParameters ({ cwd, env }) {
  const mergedEnv = {
    ...process.env,
    PIPELINE_PARAMS_SKIP_FETCH: 'true',
    ...env,
  }

  delete mergedEnv.RUN_ALL_JOBS

  if (env && Object.prototype.hasOwnProperty.call(env, 'RUN_ALL_JOBS')) {
    mergedEnv.RUN_ALL_JOBS = env.RUN_ALL_JOBS
  }

  const stdout = execSync(`bash "${SCRIPT}"`, {
    cwd,
    env: mergedEnv,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  return JSON.parse(stdout.trim())
}

function createTempRepoWithChange (changedFile) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pipeline-params-'))

  execSync('git init -b develop', { cwd: tmpDir })
  execSync('git config user.email "test@example.com"', { cwd: tmpDir })
  execSync('git config user.name "Test User"', { cwd: tmpDir })

  fs.writeFileSync(path.join(tmpDir, 'README.md'), 'base\n')
  execSync('git add . && git commit -m "base"', { cwd: tmpDir })

  execSync('git checkout -b feature/narrow-change', { cwd: tmpDir })

  const target = path.join(tmpDir, changedFile)

  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, 'changed\n')
  execSync('git add . && git commit -m "narrow change"', { cwd: tmpDir })

  return tmpDir
}

describe('generate-pipeline-parameters.sh', function () {
  this.timeout(10000)
  describe('run-all-jobs config defaults', () => {
    it('declares run-all-jobs with default false in setup and primary configs', () => {
      expect(getRunAllJobsDefault(SETUP_CONFIG)).to.equal(false)
      expect(getRunAllJobsDefault(PRIMARY_CONFIG)).to.equal(false)
      assertRunAllJobsDefaultsFalse()
    })
  })

  describe('path filtering on feature branches', () => {
    let tmpDir

    afterEach(() => {
      if (tmpDir) {
        fs.rmSync(tmpDir, { recursive: true, force: true })
        tmpDir = undefined
      }
    })

    it('enables only targeted jobs for a narrow packages/icons change', () => {
      tmpDir = createTempRepoWithChange('packages/icons/foo.ts')
      const params = runGeneratePipelineParameters({
        cwd: tmpDir,
        env: {
          CIRCLE_BRANCH: 'feature/narrow-change',
          CIRCLE_PROJECT_USERNAME: 'cypress-io',
          CIRCLE_PROJECT_REPONAME: 'cypress',
        },
      })

      expect(params['run-driver-tests']).to.equal(true)
      expect(params['run-server-tests']).to.equal(true)
      expect(params['run-system-tests']).to.equal(true)
      expect(params['run-cli-tests']).to.equal(false)
      expect(params['run-v8-tests']).to.equal(false)
      expect(params['run-app-ui-tests']).to.equal(true)
    })

    it('skips path filtering when RUN_ALL_JOBS=true (manual Trigger Pipeline)', () => {
      tmpDir = createTempRepoWithChange('packages/icons/foo.ts')
      const params = runGeneratePipelineParameters({
        cwd: tmpDir,
        env: {
          CIRCLE_BRANCH: 'feature/narrow-change',
          CIRCLE_PROJECT_USERNAME: 'cypress-io',
          CIRCLE_PROJECT_REPONAME: 'cypress',
          RUN_ALL_JOBS: 'true',
        },
      })

      const runFlags = Object.entries(params).filter(([key]) => key.startsWith('run-'))

      for (const [, value] of runFlags) {
        expect(value, 'all run-* parameters should be true when RUN_ALL_JOBS=true').to.equal(true)
      }
    })

    it('does not treat unset RUN_ALL_JOBS as true (path filtering still applies)', () => {
      tmpDir = createTempRepoWithChange('packages/icons/foo.ts')
      const params = runGeneratePipelineParameters({
        cwd: tmpDir,
        env: {
          CIRCLE_BRANCH: 'feature/narrow-change',
          CIRCLE_PROJECT_USERNAME: 'cypress-io',
          CIRCLE_PROJECT_REPONAME: 'cypress',
        },
      })

      expect(params['run-cli-tests']).to.equal(false)
    })

    it('runs all jobs on develop without RUN_ALL_JOBS', () => {
      tmpDir = createTempRepoWithChange('packages/icons/foo.ts')
      const params = runGeneratePipelineParameters({
        cwd: tmpDir,
        env: {
          CIRCLE_BRANCH: 'develop',
          CIRCLE_PROJECT_USERNAME: 'cypress-io',
          CIRCLE_PROJECT_REPONAME: 'cypress',
        },
      })

      expect(params['run-cli-tests']).to.equal(true)
      expect(params['run-v8-tests']).to.equal(true)
    })
  })
})
