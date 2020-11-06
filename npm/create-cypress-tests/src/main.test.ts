import { expect, use } from 'chai'
import path from 'path'
import sinon, { SinonStub, SinonSpy, SinonSpyCallApi } from 'sinon'
import mockFs from 'mock-fs'
import fsExtra from 'fs-extra'
import { main } from './main'
import sinonChai from 'sinon-chai'
import childProcess from 'child_process'

use(sinonChai)

function someOfSpyCallsIncludes (spy: any, logPart: string) {
  return spy.getCalls().some(
    (spy: SinonSpyCallApi<unknown[]>) => {
      return spy.args.some((callArg) => typeof callArg === 'string' && callArg.includes(logPart))
    },
  )
}

describe('init script', () => {
  let promptSpy: SinonStub<any> | null = null
  let logSpy: SinonSpy | null = null
  let execStub: SinonStub | null = null
  let fsCopyStub: SinonStub | null = null

  beforeEach(() => {
    logSpy = sinon.spy(global.console, 'log')
    // @ts-ignore
    execStub = sinon.stub(childProcess, 'exec').callsFake((command, callback) => callback())
    // @ts-ignore
    fsCopyStub = sinon.stub(fsExtra, 'copy').returns(Promise.resolve())
  })

  afterEach(() => {
    mockFs.restore()
    logSpy?.restore()
    promptSpy?.restore()
    execStub?.restore()
    fsCopyStub?.restore()
  })

  it('Install cypress if no config found', async () => {
    mockFs({
      '/package.json': JSON.stringify({ }),
    })

    await main({ useNpm: false, ignoreTs: false, ignoreExamples: false, setupComponentTesting: false })

    expect(execStub).calledWith('yarn add cypress --dev')
  })

  it('Uses npm if yarn is not available', async () => {
    execStub
    ?.onFirstCall().callsFake((command, callback) => callback('yarn is not available'))
    ?.onSecondCall().callsFake((command, callback) => callback())

    mockFs({
      '/package.json': JSON.stringify({ }),
    })

    await main({ useNpm: false, ignoreTs: false, ignoreExamples: false, setupComponentTesting: false })
    expect(execStub).calledWith('npm install -D cypress')
  })

  it('Uses npm if --use-npm was provided', async () => {
    mockFs({
      '/package.json': JSON.stringify({ }),
    })

    await main({ useNpm: true, ignoreTs: false, ignoreExamples: false, setupComponentTesting: false })

    expect(execStub).calledWith('npm install -D cypress')
  })

  it('Prints correct commands helper for npm', async () => {
    mockFs({
      '/package.json': JSON.stringify({ }),
    })

    await main({ useNpm: true, ignoreTs: false, ignoreExamples: false, setupComponentTesting: false })
    expect(someOfSpyCallsIncludes(logSpy, 'npx cypress open')).to.be.true
  })

  it('Prints correct commands helper for yarn', async () => {
    mockFs({
      '/package.json': JSON.stringify({ }),
    })

    await main({ useNpm: false, ignoreTs: false, ignoreExamples: false, setupComponentTesting: false })
    expect(someOfSpyCallsIncludes(logSpy, 'yarn cypress open')).to.be.true
  })

  context('e2e fs tests', () => {
    const e2eTestOutputPath = path.resolve(__dirname, 'test-output')

    beforeEach(async () => {
      fsCopyStub?.restore()
      sinon.stub(process, 'cwd').returns(e2eTestOutputPath)

      await fsExtra.remove(e2eTestOutputPath)
      await fsExtra.mkdir(e2eTestOutputPath)
    })

    it('Copies plugins and support files', async () => {
      await fsExtra.outputFile(
        path.join(e2eTestOutputPath, 'package.json'),
        JSON.stringify({ name: 'test' }, null, 2),
      )

      await main({ useNpm: true, ignoreTs: false, ignoreExamples: false, setupComponentTesting: false })

      expect(await fsExtra.pathExists(path.resolve(e2eTestOutputPath, 'cypress', 'plugins', 'index.js'))).to.equal(true)
      expect(await fsExtra.pathExists(path.resolve(e2eTestOutputPath, 'cypress', 'support', 'index.js'))).to.equal(true)
      expect(await fsExtra.pathExists(path.resolve(e2eTestOutputPath, 'cypress', 'support', 'commands.js'))).to.equal(true)
      expect(await fsExtra.pathExists(path.resolve(e2eTestOutputPath, 'cypress.json'))).to.equal(true)
    })

    it('Copies tsconfig if typescript is installed', async () => {
      await fsExtra.outputFile(
        path.join(e2eTestOutputPath, 'package.json'),
        JSON.stringify({
          name: 'test-typescript',
          dependencies: { typescript: '^4.0.0' },
        }, null, 2),
      )

      await main({ useNpm: false, ignoreTs: false, ignoreExamples: false, setupComponentTesting: false })
      await fsExtra.pathExists(path.resolve(e2eTestOutputPath, 'cypress', 'tsconfig.json'))
    })
  })
})
