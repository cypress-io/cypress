import { expect } from 'chai'
import path from 'path'
import { e2eProjectDirs } from '@packages/frontend-shared/cypress/e2e/support/e2eProjectDirs'
import { createTestDataContext } from '../helper'

function getCurrentProject (project: typeof e2eProjectDirs[number]) {
  return path.join(__dirname, '..', '..', '..', '..', '..', 'system-tests', 'projects', project)
}

describe('packagesToInstall', () => {
  it('create-react-app-unconfigured', async () => {
    const ctx = createTestDataContext()

    ctx.coreData.currentProject = getCurrentProject('create-react-app-unconfigured')
    ctx.coreData.wizard.chosenFramework = 'crav5'
    ctx.coreData.wizard.chosenBundler = 'webpack5'

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D @cypress/react@^5.0.0 webpack@^5.0.0 @cypress/webpack-dev-server@latest webpack-dev-server@^4.0.0 html-webpack-plugin@^5.0.0`)
  })

  it('vueclivue2-unconfigured', async () => {
    const ctx = createTestDataContext()

    ctx.coreData.currentProject = getCurrentProject('vueclivue2-unconfigured')
    ctx.coreData.wizard.chosenFramework = 'vueclivue2'
    ctx.coreData.wizard.chosenBundler = 'webpack4'

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D @cypress/vue@^2.0.0 webpack@^4.0.0 @cypress/webpack-dev-server@latest webpack-dev-server@^4.0.0 html-webpack-plugin@^4.0.0`)
  })

  it('vueclivue3-unconfigured', async () => {
    const ctx = createTestDataContext()

    ctx.coreData.currentProject = getCurrentProject('vueclivue3-unconfigured')
    ctx.coreData.wizard.chosenFramework = 'vueclivue3'
    ctx.coreData.wizard.chosenBundler = 'webpack4'

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D @cypress/vue@^3.0.0 webpack@^4.0.0 @cypress/webpack-dev-server@latest webpack-dev-server@^4.0.0 html-webpack-plugin@^4.0.0`)
  })

  it('regular react project with vite', async () => {
    const ctx = createTestDataContext()

    ctx.coreData.currentProject = getCurrentProject('react-vite-ts-unconfigured')
    ctx.coreData.wizard.chosenFramework = 'react'
    ctx.coreData.wizard.chosenBundler = 'vite'

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D @cypress/react@^5.0.0 @cypress/vite-dev-server@latest`)
  })

  it('regular vue project with vite', async () => {
    const ctx = createTestDataContext()

    ctx.coreData.currentProject = getCurrentProject('vue3-vite-ts-unconfigured')
    ctx.coreData.wizard.chosenFramework = 'vue3'
    ctx.coreData.wizard.chosenBundler = 'vite'

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D @cypress/vue@^3.0.0 @cypress/vite-dev-server@latest`)
  })

  it('nextjs-unconfigured', async () => {
    const ctx = createTestDataContext()

    ctx.coreData.currentProject = getCurrentProject('nextjs-unconfigured')
    ctx.coreData.wizard.chosenFramework = 'nextjs'
    ctx.coreData.wizard.chosenBundler = 'webpack4'

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D @cypress/react@^5.0.0 webpack@^4.0.0 @cypress/webpack-dev-server@latest webpack-dev-server@^4.0.0 html-webpack-plugin@^4.0.0`)
  })

  it('nuxtjs-vue2-unconfigured', async () => {
    const ctx = createTestDataContext()

    ctx.coreData.currentProject = getCurrentProject('nuxtjs-vue2-unconfigured')
    ctx.coreData.wizard.chosenFramework = 'nuxtjs'
    ctx.coreData.wizard.chosenBundler = 'webpack4'

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq('npm install -D @cypress/vue@^2.0.0 webpack@^4.0.0 @cypress/webpack-dev-server@latest webpack-dev-server@^4.0.0 html-webpack-plugin@^4.0.0')
  })

  it('pristine-with-e2e-testing-and-storybook', async () => {
    const ctx = createTestDataContext()

    ctx.coreData.currentProject = getCurrentProject('pristine-with-e2e-testing-and-storybook')
    ctx.coreData.wizard.chosenFramework = 'react'
    ctx.coreData.wizard.chosenBundler = 'webpack4'

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq('npm install -D @cypress/react@^5.0.0 @cypress/webpack-dev-server@latest webpack-dev-server@^4.0.0 html-webpack-plugin@^4.0.0 @storybook/testing-react@latest')
  })

  it('framework and bundler are undefined', async () => {
    const ctx = createTestDataContext()

    // this should never happen!
    ctx.coreData.currentProject = getCurrentProject('pristine-with-e2e-testing-and-storybook')
    ctx.coreData.wizard.chosenFramework = undefined
    ctx.coreData.wizard.chosenBundler = undefined

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.be.null
  })
})
