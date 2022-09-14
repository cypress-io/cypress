import { WizardBundler, WizardFrontendFramework, WIZARD_BUNDLERS, WIZARD_FRAMEWORKS } from '@packages/scaffold-config'
import { expect } from 'chai'
import { createTestDataContext, scaffoldMigrationProject, removeCommonNodeModules } from '../helper'

function findFramework (type: WizardFrontendFramework['type']) {
  return WIZARD_FRAMEWORKS.find((x) => x.type === type)!
}

function findBundler (type: WizardBundler['type']) {
  return WIZARD_BUNDLERS.find((x) => x.type === type)!
}

describe('packagesToInstall', () => {
  before(() => {
    removeCommonNodeModules()
  })

  it('create-react-app-unconfigured', async () => {
    const ctx = createTestDataContext()
    const projectPath = await scaffoldMigrationProject('create-react-app-unconfigured')

    ctx.update((coreData) => {
      coreData.currentProject = projectPath
      coreData.wizard.chosenFramework = findFramework('reactscripts')
      coreData.wizard.chosenBundler = findBundler('webpack')
    })

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D react-scripts react-dom react`)
  })

  it('vueclivue2-unconfigured', async () => {
    const ctx = createTestDataContext()

    const projectPath = await scaffoldMigrationProject('vueclivue2-unconfigured')

    ctx.update((coreData) => {
      coreData.currentProject = projectPath
      coreData.wizard.chosenFramework = findFramework('vueclivue2')
      coreData.wizard.chosenBundler = findBundler('webpack')
    })

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D @vue/cli-service vue@2`)
  })

  it('vueclivue3-unconfigured', async () => {
    const ctx = createTestDataContext()

    const projectPath = await scaffoldMigrationProject('vueclivue3-unconfigured')

    ctx.update((coreData) => {
      coreData.currentProject = projectPath
      coreData.wizard.chosenFramework = findFramework('vueclivue3')
      coreData.wizard.chosenBundler = findBundler('webpack')
    })

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D @vue/cli-service vue`)
  })

  it('vuecli5vue3-unconfigured', async () => {
    const ctx = createTestDataContext()

    const projectPath = await scaffoldMigrationProject('vuecli5vue3-unconfigured')

    ctx.update((coreData) => {
      coreData.currentProject = projectPath
      coreData.wizard.chosenFramework = findFramework('vueclivue3')
      coreData.wizard.chosenBundler = findBundler('webpack')
    })

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D @vue/cli-service vue`)
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

  it('nuxtjs-vue2-unconfigured', async () => {
    const ctx = createTestDataContext()

    const projectPath = await scaffoldMigrationProject('nuxtjs-vue2-unconfigured')

    ctx.update((coreData) => {
      coreData.currentProject = projectPath
      coreData.wizard.chosenFramework = findFramework('nuxtjs')
      coreData.wizard.chosenBundler = findBundler('webpack')
    })

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq('npm install -D nuxt@2 vue@2')
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
