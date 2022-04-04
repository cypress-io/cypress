import { WIZARD_BUNDLERS, WIZARD_FRAMEWORKS } from '@packages/scaffold-config'
import { expect } from 'chai'
import { createTestDataContext, getSystemTestProject } from '../helper'

function findFramework (type: typeof WIZARD_FRAMEWORKS[number]['type']) {
  return WIZARD_FRAMEWORKS.find((x) => x.type === type)!
}

function findBundler (type: typeof WIZARD_BUNDLERS[number]['type']) {
  return WIZARD_BUNDLERS.find((x) => x.type === type)!
}

describe('packagesToInstall', () => {
  it('create-react-app-unconfigured', () => {
    const ctx = createTestDataContext()

    ctx.update((coreData) => {
      coreData.currentProject = getSystemTestProject('create-react-app-unconfigured')
      coreData.wizard.chosenFramework = findFramework('reactscripts')
      coreData.wizard.chosenBundler = findBundler('webpack')
    })

    const actual = ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D webpack react-scripts`)
  })

  it('vueclivue2-unconfigured', async () => {
    const ctx = createTestDataContext()

    ctx.update((coreData) => {
      coreData.currentProject = getSystemTestProject('vueclivue2-unconfigured')
      coreData.wizard.chosenFramework = findFramework('vueclivue2')
      coreData.wizard.chosenBundler = findBundler('webpack')
    })

    const actual = ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D @vue/cli-service vue@2`)
  })

  it('vueclivue3-unconfigured', async () => {
    const ctx = createTestDataContext()

    ctx.update((coreData) => {
      coreData.currentProject = getSystemTestProject('vueclivue3-unconfigured')
      coreData.wizard.chosenFramework = findFramework('vueclivue3')
      coreData.wizard.chosenBundler = findBundler('webpack')
    })

    const actual = ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D @vue/cli-service vue`)
  })

  it('vuecli5vue3-unconfigured', async () => {
    const ctx = createTestDataContext()

    ctx.update((coreData) => {
      coreData.currentProject = getSystemTestProject('vuecli5vue3-unconfigured')
      coreData.wizard.chosenFramework = findFramework('vueclivue3')
      coreData.wizard.chosenBundler = findBundler('webpack')
    })

    const actual = ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D @vue/cli-service vue`)
  })

  it('regular react project with vite', async () => {
    const ctx = createTestDataContext()

    ctx.update((coreData) => {
      coreData.currentProject = getSystemTestProject('react-vite-ts-unconfigured')
      coreData.wizard.chosenFramework = findFramework('react')
      coreData.wizard.chosenBundler = findBundler('vite')
    })

    const actual = ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D vite react`)
  })

  it('regular vue project with vite', async () => {
    const ctx = createTestDataContext()

    ctx.update((coreData) => {
      coreData.currentProject = getSystemTestProject('vue3-vite-ts-unconfigured')
      coreData.wizard.chosenFramework = findFramework('vue3')
      coreData.wizard.chosenBundler = findBundler('vite')
    })

    const actual = ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D vite vue`)
  })

  it('nextjs-unconfigured', async () => {
    const ctx = createTestDataContext()

    ctx.update((coreData) => {
      coreData.currentProject = getSystemTestProject('nextjs-unconfigured')
      coreData.wizard.chosenFramework = findFramework('nextjs')
      coreData.wizard.chosenBundler = findBundler('webpack')
    })

    const actual = ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D next react`)
  })

  it('nuxtjs-vue2-unconfigured', async () => {
    const ctx = createTestDataContext()

    ctx.update((coreData) => {
      coreData.currentProject = getSystemTestProject('nuxtjs-vue2-unconfigured')
      coreData.wizard.chosenFramework = findFramework('nuxtjs')
      coreData.wizard.chosenBundler = findBundler('webpack')
    })

    const actual = ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq('npm install -D nuxt vue@2')
  })

  it('pristine-with-e2e-testing-and-storybook', async () => {
    const ctx = createTestDataContext()

    ctx.update((coreData) => {
      coreData.currentProject = getSystemTestProject('pristine-with-e2e-testing-and-storybook')
      coreData.wizard.chosenFramework = findFramework('react')
      coreData.wizard.chosenBundler = findBundler('webpack')
    })

    const actual = ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq('npm install -D webpack react')
  })

  it('framework and bundler are undefined', async () => {
    const ctx = createTestDataContext()

    ctx.update((coreData) => {
    // this should never happen!
      coreData.currentProject = getSystemTestProject('pristine-with-e2e-testing-and-storybook')
      coreData.wizard.chosenFramework = undefined
      coreData.wizard.chosenBundler = undefined
    })

    const actual = ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq('')
  })
})
