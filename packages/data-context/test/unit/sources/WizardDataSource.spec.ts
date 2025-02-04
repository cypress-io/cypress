import { WizardBundler, WIZARD_BUNDLERS, CT_FRAMEWORKS, resolveComponentFrameworkDefinition } from '@packages/scaffold-config'
import { expect } from 'chai'
import { createTestDataContext, scaffoldMigrationProject, removeCommonNodeModules } from '../helper'

function findFramework (type: Cypress.ResolvedComponentFrameworkDefinition['type']) {
  return resolveComponentFrameworkDefinition(CT_FRAMEWORKS.find((x) => x.type === type)!)
}

function findBundler (type: WizardBundler['type']) {
  return WIZARD_BUNDLERS.find((x) => x.type === type)!
}

describe('packagesToInstall', () => {
  before(() => {
    removeCommonNodeModules()
  })

  it('regular react project with webpack', async () => {
    const ctx = createTestDataContext()

    const projectPath = await scaffoldMigrationProject('react18-webpack-unconfigured')

    ctx.update((coreData) => {
      coreData.currentProject = projectPath
      coreData.wizard.chosenFramework = findFramework('react')
      coreData.wizard.chosenBundler = findBundler('webpack')
    })

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D webpack react react-dom`)
  })

  it('regular vue project with webpack', async () => {
    const ctx = createTestDataContext()

    const projectPath = await scaffoldMigrationProject('vue3-webpack-ts-unconfigured')

    ctx.update((coreData) => {
      coreData.currentProject = projectPath
      coreData.wizard.chosenFramework = findFramework('vue3')
      coreData.wizard.chosenBundler = findBundler('webpack')
    })

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D webpack vue`)
  })

  it('regular react project with vite', async () => {
    const ctx = createTestDataContext()

    const projectPath = await scaffoldMigrationProject('react-vite-ts-unconfigured')

    ctx.update((coreData) => {
      coreData.currentProject = projectPath
      coreData.wizard.chosenFramework = findFramework('react')
      coreData.wizard.chosenBundler = findBundler('vite')
    })

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D vite react react-dom`)
  })

  it('regular vue project with vite', async () => {
    const ctx = createTestDataContext()

    const projectPath = await scaffoldMigrationProject('vue3-vite-ts-unconfigured')

    ctx.update((coreData) => {
      coreData.currentProject = projectPath
      coreData.wizard.chosenFramework = findFramework('vue3')
      coreData.wizard.chosenBundler = findBundler('vite')
    })

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D vite vue`)
  })

  it('nextjs-unconfigured', async () => {
    const ctx = createTestDataContext()

    const projectPath = await scaffoldMigrationProject('nextjs-unconfigured')

    ctx.update((coreData) => {
      coreData.currentProject = projectPath
      coreData.wizard.chosenFramework = findFramework('nextjs')
      coreData.wizard.chosenBundler = findBundler('webpack')
    })

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D next react react-dom`)
  })

  it('framework and bundler are undefined', async () => {
    const ctx = createTestDataContext()
    const projectPath = await scaffoldMigrationProject('pristine-with-e2e-testing')

    ctx.update((coreData) => {
    // this should never happen!
      coreData.currentProject = projectPath
      coreData.wizard.chosenFramework = null
      coreData.wizard.chosenBundler = null
    })

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq('')
  })
})
