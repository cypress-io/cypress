import path from 'path'
import { randomUUID } from 'crypto'
import { fs } from '@packages/server/lib/util/fs'
import systemTests, { expect } from '../lib/system-tests'
import Fixtures from '../lib/fixtures'
import { createRoutes, getRequests, postRunInstanceResponse, postRunResponseWithProtocolDisabled, setupStubbedServer } from '../lib/serverStub'

const projectPath = Fixtures.projectPath('run-workers')
const outputPath = path.join(projectPath, 'output.json')

const readLines = async (name: string) => {
  const contents = await fs.readFileAsync(path.join(projectPath, 'events', name), 'utf8')

  return contents.trim().split('\n')
}

describe('cypress run --workers', () => {
  systemTests.setup()

  systemTests.it('runs every spec once across workers and reports one combined result', {
    project: 'run-workers',
    // in every browser but Electron, the spawned workers run as plain Node rather than Electron
    browser: ['electron', 'chrome', 'firefox', 'webkit'],
    workers: 3,
    outputPath,
    expectedExitCode: 1,
    async onRun (exec, browser) {
      const { stdout } = await exec()

      // the worker that ran failing.cy.ts exits with its failure count, which is not an early exit
      expect(stdout).not.to.include('exited early')

      const results = await fs.readJsonAsync(outputPath)
      const ranSpecs = results.runs.map((run) => run.spec.relative)

      expect(ranSpecs).to.deep.eq([
        'cypress/e2e/download.cy.ts',
        'cypress/e2e/failing.cy.ts',
        'cypress/e2e/passing_1.cy.ts',
        'cypress/e2e/passing_2.cy.ts',
        'cypress/e2e/passing_3.cy.ts',
        'cypress/e2e/passing_4.cy.ts',
      ])

      expect(results.totalTests).to.eq(6)
      expect(results.totalFailed).to.eq(1)

      expect(await readLines('before-run')).to.deep.eq(['0'])
      expect(await readLines('after-run')).to.deep.eq(['0'])

      const specWorkers = new Map((await readLines('specs')).map((line) => {
        const [index, spec] = line.split(' ')

        return [spec, index]
      }))

      expect(specWorkers.size).to.eq(6)
      expect(new Set(specWorkers.values()).size, 'specs ran on more than one worker').to.be.greaterThan(1)

      // TODO(webkit): check the download once Cypress supports downloads in WebKit
      if (browser !== 'webkit') {
        const downloadWorker = specWorkers.get('cypress/e2e/download.cy.ts')
        const downloadsFolder = downloadWorker === '0' ? 'downloads' : path.join('downloads', `worker-${downloadWorker}`)

        expect(await fs.pathExistsAsync(path.join(projectPath, 'cypress', downloadsFolder, 'hello.txt'))).to.be.true
      }

      const webpackLoaded = new Map((await readLines('webpack')).map((line) => line.split(' ') as [string, string]))

      expect(webpackLoaded.get('0'), 'the coordinator bundles the specs').to.eq('true')
      expect([...webpackLoaded].filter(([index]) => index !== '0').map(([, loaded]) => loaded), 'spawned workers never load webpack').to.not.include('true')

      const renderers = await readLines('renderers')

      expect(new Set(renderers.map((line) => line.split(' ')[0])).size, 'renderers came from more than one worker').to.be.greaterThan(1)

      // only Chromium-based browsers render in software with --workers
      if (browser === 'electron' || browser === 'chrome') {
        renderers.forEach((line) => expect(line, 'WebGL renders in software').to.include('SwiftShader'))
      }
    },
  })

  systemTests.it('errors on a worker count that is not a positive integer', {
    project: 'run-workers',
    browser: 'electron',
    workers: 0 as any,
    expectedExitCode: 1,
    onStdout (stdout) {
      expect(stdout).to.include('The --workers flag must be a whole number of 1 or more')
    },
  })
})

describe('cypress run --component --workers', () => {
  systemTests.setup()

  for (const [project, ext] of [['run-all-specs-ct-vite', 'tsx'], ['run-all-specs-ct-webpack', 'jsx']]) {
    systemTests.it(`runs every ${project} spec once across workers`, {
      project,
      testingType: 'component',
      browser: ['electron', 'chrome'],
      workers: 3,
      snapshot: false,
      expectedExitCode: 0,
      async onRun (exec) {
        const ctOutputPath = path.join(Fixtures.projectPath(project), 'output.json')

        const { stdout, stderr } = await exec({ outputPath: ctOutputPath })
        const output = stdout + stderr

        // a worker that can't start leaves its specs to the others, so the results alone don't show it
        expect(output).not.to.include('exited early')

        // workers use the coordinator's dev server instead of starting their own
        if (project.endsWith('webpack')) {
          expect(output.match(/\[webpack-dev-server\] Project is running at/g), 'webpack dev servers started').to.have.length(1)
        } else {
          expect(output).not.to.include('is in use, trying another one')
        }

        const results = await fs.readJsonAsync(ctOutputPath)

        expect(results.runs.map((run) => run.spec.relative).sort()).to.deep.eq([
          'component/component-a.cy',
          'component/folder-a/component-a.cy',
          'component/folder-a/component-b.cy',
          'component/folder-b/component-a.cy',
          'component/folder-b/folder-c/component-a.cy',
          'component/folder-b/folder-c/component-b.cy',
        ].map((spec) => `${spec}.${ext}`).sort())

        expect(results.totalFailed).to.eq(0)
        expect(results.totalPassed).to.be.greaterThan(0)
      },
    })
  }
})

describe('cypress run --workers --record', () => {
  const e2ePath = Fixtures.projectPath('e2e')
  const recordedOutputPath = path.join(e2ePath, 'output.json')
  const specs = ['simple_passing.cy.js', 'simple.cy.js', 'simple_hooks.cy.js', 'simple_pending.cy.js', 'record_pass.cy.js']

  // every worker creates the run, so the spec list is only taken from the first one
  const mockServerState = setupStubbedServer(createRoutes({
    postRun: {
      res (req, res) {
        if (!mockServerState.allSpecs.length) {
          mockServerState.setSpecs(req)
        }

        return res.json({ ...postRunResponseWithProtocolDisabled(), machineId: randomUUID() })
      },
    },
    postRunInstance: {
      res (req, res) {
        return res.json({
          ...postRunInstanceResponse,
          instanceId: randomUUID(),
          spec: mockServerState.specs.shift() || null,
          claimedInstances: mockServerState.allSpecs.length - mockServerState.specs.length,
          totalInstances: mockServerState.allSpecs.length,
        })
      },
    },
  }))

  it('joins every worker to one parallel Cloud run and gets each spec from Cloud once', async function () {
    await systemTests.exec(this, {
      key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
      configFile: 'cypress-with-project-id-without-video.config.js',
      spec: specs.join(','),
      record: true,
      workers: 3,
      browser: 'electron',
      outputPath: recordedOutputPath,
      expectedExitCode: 0,
      // on CircleCI the provider's build id would stand in for the generated one
      processEnv: { CIRCLECI: undefined },
    })

    const requests = getRequests()
    const createRuns = requests.filter((r) => r.url === 'POST /runs')

    expect(createRuns).to.have.length(3)
    expect(createRuns.every((r) => r.body.parallel === true)).to.be.true
    expect(new Set(createRuns.map((r) => r.body.ciBuildId)).size).to.eq(1)
    expect(createRuns[0].body.ciBuildId).to.match(/^local-/)

    const claimed = requests.filter((r) => /^POST \/runs\/[^/]+\/instances$/.test(r.url))

    // each worker asks once more and gets no spec
    expect(claimed).to.have.length(specs.length + 3)
    expect(requests.filter((r) => /^POST \/instances\/[^/]+\/results$/.test(r.url))).to.have.length(specs.length)

    const uploadedStdout = requests.filter((r) => /^PUT \/instances\/[^/]+\/stdout$/.test(r.url)).map((r) => r.body.stdout).join('')

    expect(uploadedStdout).to.include('Running:')
    expect(uploadedStdout).not.to.include('cypress:worker:spec-end')

    const results = await fs.readJsonAsync(recordedOutputPath)

    expect(results.runs.map((run) => path.basename(run.spec.relative)).sort()).to.deep.eq([...specs].sort())
    expect(results.totalFailed).to.eq(0)
  })
})
