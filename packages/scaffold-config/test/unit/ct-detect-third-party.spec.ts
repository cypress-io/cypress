import { scaffoldMigrationProject, fakeDepsInNodeModules } from './detect.spec'
import fs from 'fs-extra'
import path from 'path'
import { detectThirdPartyCTFrameworks, validateThirdPartyModule } from '../../src'
import { expect } from 'chai'
import { solidJs } from './fixtures'

async function scaffoldQwikApp (thirdPartyModuleNames: Array<'cypress-ct-qwik' | 'misconfigured-cypress-ct-qwik'>) {
  const projectRoot = await scaffoldMigrationProject('qwik-app')

  await fakeDepsInNodeModules(projectRoot, [{ dependency: '@builder.io/qwik', version: '0.17.5' }])
  for (const thirdPartyModuleName of thirdPartyModuleNames) {
    const nodeModulePath = path.join(projectRoot, 'node_modules', thirdPartyModuleName)

    await fs.remove(nodeModulePath)
    await fs.copy(path.join(projectRoot, thirdPartyModuleName), nodeModulePath)
  }

  return projectRoot
}

describe('detectThirdPartyCTFrameworks', () => {
  it('detects third party frameworks', async () => {
    const projectRoot = await scaffoldQwikApp(['cypress-ct-qwik'])

    const thirdPartyFrameworks = await detectThirdPartyCTFrameworks(projectRoot)

    expect(thirdPartyFrameworks[0].type).eq('cypress-ct-qwik')
  })

  it('ignores misconfigured third party frameworks', async () => {
    const projectRoot = await scaffoldQwikApp(['cypress-ct-qwik', 'misconfigured-cypress-ct-qwik'])

    const thirdPartyFrameworks = await detectThirdPartyCTFrameworks(projectRoot)

    expect(thirdPartyFrameworks.length).eq(1)
    expect(thirdPartyFrameworks[0].type).eq('cypress-ct-qwik')
  })

  it('validates third party module', () => {
    expect(() => validateThirdPartyModule(solidJs)).to.not.throw()

    const gen = (m: any) => m

    expect(() => validateThirdPartyModule(gen({ ...solidJs, type: 'misconfigured' }))).to.throw()
    expect(() => validateThirdPartyModule(gen({ ...solidJs, configFramework: 'misconfigured' }))).to.throw()
    expect(() => validateThirdPartyModule(gen({ ...solidJs, name: 5 }))).to.throw()
    expect(() => validateThirdPartyModule(gen({ ...solidJs, supportedBundlers: ['random'] }))).to.throw()
    expect(() => validateThirdPartyModule(gen({ ...solidJs, detectors: {} }))).to.throw()
    expect(() => validateThirdPartyModule(gen({ ...solidJs, dependencies: {} }))).to.throw()
    expect(() => validateThirdPartyModule(gen({ ...solidJs, mountModule: {} }))).to.throw()
    expect(() => validateThirdPartyModule(gen({ ...solidJs, componentIndexHtml: {} }))).to.throw()
  })
})
