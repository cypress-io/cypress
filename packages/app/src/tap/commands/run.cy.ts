import type { FoundSpec } from '@packages/types'

import { TapManager } from '../tap-manager'
import { tapNavigation } from './run'

const CYPRESS_VERSION = '15.0.0'

describe('tap/commands/run', () => {
  const RUN_MODE_SPECS: FoundSpec[] = [
    {
      name: 'login.cy.ts',
      relative: 'cypress/e2e/login.cy.ts',
      absolute: '/project/cypress/e2e/login.cy.ts',
      baseName: 'login.cy.ts',
      fileName: 'login',
      fileExtension: '.ts',
      specFileExtension: '.cy.ts',
      specType: 'integration',
    },
  ]

  // Stub the navigation seam — a real hash change would navigate away and stop
  // the test mid-command. Writes feed the stubbed read, like the real hash.
  const stubNavigation = (initialHash = '') => {
    const getHash = cy.stub(tapNavigation, 'getHash').returns(initialHash)

    return cy.stub(tapNavigation, 'setHash').callsFake((hash: string) => {
      getHash.returns(`#${hash}`)
    })
  }

  afterEach(() => {
    delete (window as any).__RUN_MODE_SPECS__
  })

  it('fails dispatch without navigating when the required spec arg is missing', async () => {
    window.__RUN_MODE_SPECS__ = RUN_MODE_SPECS

    const setHash = stubNavigation()
    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('run')

    expect((outcome as { error: { code: string } }).error.code).to.eq('INVALID_ARGUMENTS')
    expect((outcome as { error: { message: string } }).error.message).to.contain('Usage: cypress tap run <spec>')
    expect(setHash).not.to.have.been.called
  })

  it('fails with INVALID_SPEC without navigating when the param is an empty string', async () => {
    window.__RUN_MODE_SPECS__ = RUN_MODE_SPECS

    const setHash = stubNavigation()
    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('run', { spec: '' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('INVALID_SPEC')
    expect(setHash).not.to.have.been.called
  })

  it('fails with SPEC_NOT_FOUND without navigating when no spec matches', async () => {
    window.__RUN_MODE_SPECS__ = RUN_MODE_SPECS

    const setHash = stubNavigation()
    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('run', { spec: 'cypress/e2e/nope.cy.ts' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('SPEC_NOT_FOUND')
    expect((outcome as { error: { message: string } }).error.message).to.contain('cypress/e2e/nope.cy.ts')
    expect(setHash).not.to.have.been.called
  })

  it('fails with SPEC_NOT_FOUND when the specs global is not present', async () => {
    const setHash = stubNavigation()
    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('run', { spec: 'cypress/e2e/login.cy.ts' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('SPEC_NOT_FOUND')
    expect((outcome as { error: { message: string } }).error.message).to.contain('cypress/e2e/login.cy.ts')
    expect(setHash).not.to.have.been.called
  })

  it('navigates to the runner URL and resolves with the lean entry of the started spec', async () => {
    window.__RUN_MODE_SPECS__ = RUN_MODE_SPECS

    const setHash = stubNavigation()
    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('run', { spec: 'cypress/e2e/login.cy.ts' })

    expect(outcome).to.deep.eq({
      result: { relativePath: 'cypress/e2e/login.cy.ts', specType: 'integration' },
    })

    expect(setHash).to.have.been.calledOnce
    expect(setHash.firstCall.args[0]).to.match(/^\/specs\/runner\?file=cypress\/e2e\/login\.cy\.ts&tapRun=\d+$/)
  })

  it('advances the tapRun nonce so rerunning the same spec changes the query', async () => {
    window.__RUN_MODE_SPECS__ = RUN_MODE_SPECS

    const setHash = stubNavigation()
    const manager = new TapManager(CYPRESS_VERSION)

    const readNonce = (href: string) => Number(href.match(/tapRun=(\d+)$/)?.[1])

    await manager.exec('run', { spec: 'cypress/e2e/login.cy.ts' })
    await manager.exec('run', { spec: 'cypress/e2e/login.cy.ts' })

    const first = readNonce(setHash.firstCall.args[0])
    const second = readNonce(setHash.secondCall.args[0])

    expect(first).to.be.a('number').and.not.be.NaN
    expect(second).to.be.greaterThan(first)
  })

  it('advances past a tapRun already in the hash, as after a page reload', async () => {
    window.__RUN_MODE_SPECS__ = RUN_MODE_SPECS

    const setHash = stubNavigation('#/specs/runner?file=cypress/e2e/login.cy.ts&tapRun=7')
    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('run', { spec: 'cypress/e2e/login.cy.ts' })

    expect(setHash.firstCall.args[0]).to.eq('/specs/runner?file=cypress/e2e/login.cy.ts&tapRun=8')
  })

  it('matches windows-style entries against posix input and emits the posix form in the URL', async () => {
    window.__RUN_MODE_SPECS__ = [{ ...RUN_MODE_SPECS[0], relative: 'cypress\\e2e\\login.cy.ts' }]

    const setHash = stubNavigation()
    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('run', { spec: 'cypress/e2e/login.cy.ts' })

    expect(outcome).to.deep.eq({
      result: { relativePath: 'cypress\\e2e\\login.cy.ts', specType: 'integration' },
    })

    expect(setHash.firstCall.args[0]).to.contain('file=cypress/e2e/login.cy.ts')
  })

  it('escapes URL-significant characters in the spec path', async () => {
    window.__RUN_MODE_SPECS__ = [{ ...RUN_MODE_SPECS[0], relative: 'cypress/e2e/a&b?c+d%e.cy.ts' }]

    const setHash = stubNavigation()
    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('run', { spec: 'cypress/e2e/a&b?c+d%e.cy.ts' })

    expect('result' in outcome).to.eq(true)
    expect(setHash.firstCall.args[0]).to.contain('file=cypress/e2e/a%26b%3Fc%2Bd%25e.cy.ts')
  })
})
