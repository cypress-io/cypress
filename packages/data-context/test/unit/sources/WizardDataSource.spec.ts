import { expect } from 'chai'
import { createTestDataContext, getSystemTestProject } from '../helper'

describe('packagesToInstall', () => {
  it('create-react-app-unconfigured', async () => {
    const ctx = createTestDataContext()

    ctx.coreData.currentProject = getSystemTestProject('create-react-app-unconfigured')
    ctx.coreData.wizard.chosenFramework = 'crav5'
    ctx.coreData.wizard.chosenBundler = 'webpack5'

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D @cypress/react@^5.0.0 webpack@^5.0.0 @cypress/webpack-dev-server@latest webpack-dev-server@^4.0.0 html-webpack-plugin@^5.0.0`)
  })

  it('vueclivue2-unconfigured', async () => {
    const ctx = createTestDataContext()

    ctx.coreData.currentProject = getSystemTestProject('vueclivue2-unconfigured')
    ctx.coreData.wizard.chosenFramework = 'vuecli4vue2'
    ctx.coreData.wizard.chosenBundler = 'webpack4'

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D @cypress/vue2@^1.0.0 webpack@^4.0.0 @cypress/webpack-dev-server@latest webpack-dev-server@^4.0.0 html-webpack-plugin@^4.0.0`)
  })

  it('vueclivue3-unconfigured', async () => {
    const ctx = createTestDataContext()

    ctx.coreData.currentProject = getSystemTestProject('vueclivue3-unconfigured')
    ctx.coreData.wizard.chosenFramework = 'vuecli4vue3'
    ctx.coreData.wizard.chosenBundler = 'webpack4'

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D @cypress/vue@^3.0.0 webpack@^4.0.0 @cypress/webpack-dev-server@latest webpack-dev-server@^4.0.0 html-webpack-plugin@^4.0.0`)
  })

  it('vuecli5vue3-unconfigured', async () => {
    const ctx = createTestDataContext()

    ctx.coreData.currentProject = getSystemTestProject('vuecli5vue3-unconfigured')
    ctx.coreData.wizard.chosenFramework = 'vuecli5vue3'
    ctx.coreData.wizard.chosenBundler = 'webpack5'

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D @cypress/vue@^3.0.0 webpack@^5.0.0 @cypress/webpack-dev-server@latest webpack-dev-server@^4.0.0 html-webpack-plugin@^5.0.0`)
  })

  it('regular react project with vite', async () => {
    const ctx = createTestDataContext()

    ctx.coreData.currentProject = getSystemTestProject('react-vite-ts-unconfigured')
    ctx.coreData.wizard.chosenFramework = 'react'
    ctx.coreData.wizard.chosenBundler = 'vite'

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D @cypress/react@^5.0.0 @cypress/vite-dev-server@latest`)
  })

  it('regular vue project with vite', async () => {
    const ctx = createTestDataContext()

    ctx.coreData.currentProject = getSystemTestProject('vue3-vite-ts-unconfigured')
    ctx.coreData.wizard.chosenFramework = 'vue3'
    ctx.coreData.wizard.chosenBundler = 'vite'

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D @cypress/vue@^3.0.0 @cypress/vite-dev-server@latest`)
  })

  it('nextjs-unconfigured', async () => {
    const ctx = createTestDataContext()

    ctx.coreData.currentProject = getSystemTestProject('nextjs-unconfigured')
    ctx.coreData.wizard.chosenFramework = 'nextjs'
    ctx.coreData.wizard.chosenBundler = 'webpack4'

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq(`npm install -D @cypress/react@^5.0.0 webpack@^4.0.0 @cypress/webpack-dev-server@latest webpack-dev-server@^4.0.0 html-webpack-plugin@^4.0.0`)
  })

  it('nuxtjs-vue2-unconfigured', async () => {
    const ctx = createTestDataContext()

    ctx.coreData.currentProject = getSystemTestProject('nuxtjs-vue2-unconfigured')
    ctx.coreData.wizard.chosenFramework = 'nuxtjs'
    ctx.coreData.wizard.chosenBundler = 'webpack4'

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq('npm install -D @cypress/vue2@^1.0.0 webpack@^4.0.0 @cypress/webpack-dev-server@latest webpack-dev-server@^4.0.0 html-webpack-plugin@^4.0.0')
  })

  it('pristine-with-e2e-testing-and-storybook', async () => {
    const ctx = createTestDataContext()

    ctx.coreData.currentProject = getSystemTestProject('pristine-with-e2e-testing-and-storybook')
    ctx.coreData.wizard.chosenFramework = 'react'
    ctx.coreData.wizard.chosenBundler = 'webpack4'

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.eq('npm install -D @cypress/react@^5.0.0 @cypress/webpack-dev-server@latest webpack-dev-server@^4.0.0 html-webpack-plugin@^4.0.0 @storybook/testing-react@latest')
  })

  it('framework and bundler are undefined', async () => {
    const ctx = createTestDataContext()

    // this should never happen!
    ctx.coreData.currentProject = getSystemTestProject('pristine-with-e2e-testing-and-storybook')
    ctx.coreData.wizard.chosenFramework = undefined
    ctx.coreData.wizard.chosenBundler = undefined

    const actual = await ctx.wizard.installDependenciesCommand()

    expect(actual).to.be.null
  })
})
