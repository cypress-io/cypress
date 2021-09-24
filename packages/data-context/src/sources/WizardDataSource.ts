import { Bundler, BUNDLERS, FrontendFramework, FRONTEND_FRAMEWORKS, PACKAGES_DESCRIPTIONS, WIZARD_STEPS } from '@packages/types'
import dedent from 'dedent'
import type { NexusGenEnums, NexusGenObjects } from '@packages/graphql/src/gen/nxs.gen'
import type { DataContext } from '..'

export class WizardDataSource {
  constructor (private ctx: DataContext) {}

  private get data () {
    return this.ctx.wizardData
  }

  get description () {
    return WIZARD_STEPS.find((step) => step.type === this.data.currentStep)?.description
  }

  get title () {
    return WIZARD_STEPS.find((step) => step.type === this.data.currentStep)?.title
  }

  packagesToInstall (): Array<NexusGenObjects['WizardNpmPackage']> | null {
    if (!this.chosenFramework || !this.chosenBundler) {
      return null
    }

    return [
      {
        name: this.chosenFramework.name,
        description: PACKAGES_DESCRIPTIONS[this.chosenFramework.package],
        package: this.chosenFramework.package,
      },
      {
        name: this.chosenBundler.name,
        description: PACKAGES_DESCRIPTIONS[this.chosenBundler.package],
        package: this.chosenBundler.package,
      },
    ]
  }

  get chosenTestingTypePluginsInitialized () {
    if (this.chosenTestingType === 'component' && this.ctx.activeProject?.ctPluginsInitialized) {
      return true
    }

    if (this.chosenTestingType === 'e2e' && this.ctx.activeProject?.e2ePluginsInitialized) {
      return true
    }

    return false
  }

  get canNavigateForward () {
    const data = this.ctx.wizardData

    if (data.currentStep === 'setupComplete') {
      return false
    }

    if (data.currentStep === 'selectFramework' && !data.chosenBundler && !data.chosenFramework) {
      return false
    }

    if (data.currentStep === 'initializePlugins') {
      if (data.chosenTestingType === 'component' && !this.ctx.activeProject?.ctPluginsInitialized) {
        return false
      }

      if (data.chosenTestingType === 'e2e' && !this.ctx.activeProject?.e2ePluginsInitialized) {
        return false
      }
    }

    // TODO: add constraints here to determine if we can move forward
    return true
  }

  sampleCode (lang: 'js' | 'ts') {
    const data = this.ctx.wizardData

    if (data.chosenTestingType === 'component') {
      if (!this.chosenFramework || !this.chosenBundler) {
        return null
      }

      return wizardGetConfigCode({
        type: 'component',
        framework: this.chosenFramework,
        bundler: this.chosenBundler,
        lang,
      })
    }

    if (this.chosenTestingType === 'e2e') {
      return wizardGetConfigCode({
        type: 'e2e',
        lang,
      })
    }

    return null
  }

  get chosenTestingType () {
    return this.ctx.wizardData.chosenTestingType
  }

  get chosenFramework () {
    return FRONTEND_FRAMEWORKS.find((f) => f.type === this.ctx.wizardData.chosenFramework)
  }

  get chosenBundler () {
    return BUNDLERS.find((f) => f.type === this.ctx.wizardData.chosenBundler)
  }
}

type WizardCodeLanguage = NexusGenEnums['WizardCodeLanguage']

interface GetCodeOptsE2E {
  type: 'e2e'
  lang: WizardCodeLanguage
}

interface GetCodeOptsCt {
  type: 'component'
  framework: FrontendFramework
  bundler: Bundler
  lang: WizardCodeLanguage
}

type GetCodeOpts = GetCodeOptsCt | GetCodeOptsE2E

const LanguageNames: Record<WizardCodeLanguage, string> = {
  js: 'JavaScript',
  ts: 'TypeScript',
}

export const wizardGetConfigCodeE2E = (opts: GetCodeOptsE2E): string | null => {
  return `{
  e2e: {
    viewportHeight: 660,
    viewportWidth: 1000,
}`
}

export const wizardGetConfigCode = (opts: GetCodeOpts): string | null => {
  if (opts.type === 'component') {
    return wizardGetConfigCodeCt(opts)
  }

  if (opts.type === 'e2e') {
    return wizardGetConfigCodeE2E(opts)
  }

  return null
}

const wizardGetConfigCodeCt = (opts: GetCodeOptsCt): string | null => {
  const { framework, bundler, lang } = opts

  const comments = `Component testing, ${LanguageNames[opts.lang]}, ${framework.name}, ${bundler.name}`
  const frameworkConfig = FRAMEWORK_CONFIG_FILE[framework.type]

  if (frameworkConfig) {
    return `// ${comments}

${frameworkConfig[lang]}`
  }

  const exportStatement =
    lang === 'js' ? 'module.exports = {' : 'export default {'

  const importStatements =
    lang === 'js'
      ? ''
      : [
          `import { startDevServer } from \'${bundler.package}\'`,
          `import webpackConfig from './webpack.config'`,
          '',
      ].join('\n')

  const requireStatements =
    lang === 'ts'
      ? ''
      : [
          `const { startDevServer } = require('${bundler.package}')`,
          `const webpackConfig = require('./webpack.config')`,
          '',
      ].join('\n  ')

  const startServerReturn = `return startDevServer({ options, webpackConfig })`

  return `// ${comments}
${importStatements}
${exportStatement}
  ${requireStatements}component(on, config) {
    on('dev-server:start', (options) => {
      ${startServerReturn}
    })
  }
}`
}

const FRAMEWORK_CONFIG_FILE: Partial<Record<NexusGenEnums['FrontendFrameworkEnum'], Record<NexusGenEnums['WizardCodeLanguage'], string> | null>> = {
  nextjs: {
    js: dedent`
      const injectNextDevServer = require('@cypress/react/plugins/next')

      module.exports = {
        component (on, config) {
          injectNextDevServer(on, config)
        },
      }
    `,
    ts: dedent`
      import { defineConfig } from 'cypress'
      import injectNextDevServer from '@cypress/react/plugins/next'

      export default defineConfig({
        component (on, config) {
          injectNextDevServer(on, config)
        },
      })
    `,
  },
  nuxtjs: {
    js: dedent`
      const { startDevServer } = require('@cypress/webpack-dev-server')
      const { getWebpackConfig } = require('nuxt')

      module.exports = {
        component (on, config) {
          on('dev-server:start', async (options) => {
            let webpackConfig = await getWebpackConfig('modern', 'dev')

            return startDevServer({
              options,
              webpackConfig,
            })
          })
        },
      }
    `,
    ts: dedent`
      import { defineConfig } from 'cypress'
      import { startDevServer } from '@cypress/webpack-dev-server'
      import { getWebpackConfig } from 'nuxt'

      export default defineConfig({
        component (on, config) {
          on('dev-server:start', async (options) => {
            let webpackConfig = await getWebpackConfig('modern', 'dev')

            return startDevServer({
              options,
              webpackConfig,
            })
          })
        },
      })
    `,
  },
}
