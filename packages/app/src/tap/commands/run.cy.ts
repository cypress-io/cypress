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

  // Really setting the hash here would navigate the spec frame and stop
  // the test mid-command, so every test stubs the navigation seam.
  const stubNavigation = () => cy.stub(tapNavigation, 'setHash')

  afterEach(() => {
    delete (window as any).__RUN_MODE_SPECS__
  })

  it('fails dispatch without navigating when the required spec arg is missing', async () => {
    window.__RUN_MODE_SPECS__ = RUN_MODE_SPECS

    const assign = stubNavigation()
    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('run')

    expect((outcome as { error: { code: string } }).error.code).to.eq('INVALID_ARGUMENTS')
    expect((outcome as { error: { message: string } }).error.message).to.contain('Usage: cypress tap run <spec>')
    expect(assign).not.to.have.been.called
  })

  it('fails with INVALID_SPEC without navigating when the param is an empty string', async () => {
    window.__RUN_MODE_SPECS__ = RUN_MODE_SPECS

    const assign = stubNavigation()
    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('run', { spec: '' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('INVALID_SPEC')
    expect(assign).not.to.have.been.called
  })

  it('fails with SPEC_NOT_FOUND without navigating when no spec matches', async () => {
    window.__RUN_MODE_SPECS__ = RUN_MODE_SPECS

    const assign = stubNavigation()
    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('run', { spec: 'cypress/e2e/nope.cy.ts' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('SPEC_NOT_FOUND')
    expect((outcome as { error: { message: string } }).error.message).to.contain('cypress/e2e/nope.cy.ts')
    expect(assign).not.to.have.been.called
  })

  it('fails with SPEC_NOT_FOUND when the specs global is not present', async () => {
    const assign = stubNavigation()
    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('run', { spec: 'cypress/e2e/login.cy.ts' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('SPEC_NOT_FOUND')
    expect((outcome as { error: { message: string } }).error.message).to.contain('cypress/e2e/login.cy.ts')
    expect(assign).not.to.have.been.called
  })

  it('navigates to the runner URL and resolves with the lean entry of the started spec', async () => {
    window.__RUN_MODE_SPECS__ = RUN_MODE_SPECS

    const assign = stubNavigation()
    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('run', { spec: 'cypress/e2e/login.cy.ts' })

    expect(outcome).to.deep.eq({
      result: { relativePath: 'cypress/e2e/login.cy.ts', specType: 'integration' },
    })

    expect(assign).to.have.been.calledOnce
    expect(assign.firstCall.args[0]).to.match(/^\/specs\/runner\?file=cypress\/e2e\/login\.cy\.ts&tapRun=\d+$/)
  })

  it('advances the tapRun nonce so rerunning the same spec changes the query', async () => {
    window.__RUN_MODE_SPECS__ = RUN_MODE_SPECS

    const assign = stubNavigation()
    const manager = new TapManager(CYPRESS_VERSION)

    const readNonce = (href: string) => Number(href.match(/tapRun=(\d+)$/)?.[1])

    await manager.exec('run', { spec: 'cypress/e2e/login.cy.ts' })
    await manager.exec('run', { spec: 'cypress/e2e/login.cy.ts' })

    const first = readNonce(assign.firstCall.args[0])
    const second = readNonce(assign.secondCall.args[0])

    expect(first).to.be.a('number').and.not.be.NaN
    expect(second).to.be.greaterThan(first)
  })

  it('matches windows-style entries against posix input and emits the posix form in the URL', async () => {
    window.__RUN_MODE_SPECS__ = [{ ...RUN_MODE_SPECS[0], relative: 'cypress\\e2e\\login.cy.ts' }]

    const assign = stubNavigation()
    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('run', { spec: 'cypress/e2e/login.cy.ts' })

    expect(outcome).to.deep.eq({
      result: { relativePath: 'cypress\\e2e\\login.cy.ts', specType: 'integration' },
    })

    expect(assign.firstCall.args[0]).to.contain('file=cypress/e2e/login.cy.ts')
  })

  it('escapes URL-significant characters in the spec path', async () => {
    window.__RUN_MODE_SPECS__ = [{ ...RUN_MODE_SPECS[0], relative: 'cypress/e2e/a&b?c+d%e.cy.ts' }]

    const assign = stubNavigation()
    const manager = new TapManager(CYPRESS_VERSION)

    const outcome = await manager.exec('run', { spec: 'cypress/e2e/a&b?c+d%e.cy.ts' })

    expect('result' in outcome).to.eq(true)
    expect(assign.firstCall.args[0]).to.contain('file=cypress/e2e/a%26b%3Fc%2Bd%25e.cy.ts')
  })
})
