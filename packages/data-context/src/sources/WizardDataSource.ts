import { Bundler, BUNDLERS, CodeLanguage, CODE_LANGUAGES, FrontendFramework, FRONTEND_FRAMEWORKS, PACKAGES_DESCRIPTIONS, SampleConfigFile, StorybookInfo, WIZARD_STEPS } from '@packages/types'
import type { NexusGenObjects } from '@packages/graphql/src/gen/nxs.gen'
import type { DataContext } from '..'
import { getSampleConfigFiles } from '../codegen/sample-config-files'
import dedent from 'dedent'

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

  async packagesToInstall (): Promise<Array<NexusGenObjects['WizardNpmPackage']> | null> {
    if (!this.chosenFramework || !this.chosenBundler) {
      return null
    }

    const packages = [
      {
        name: this.chosenFramework.name as string,
        description: PACKAGES_DESCRIPTIONS[this.chosenFramework.package],
        package: this.chosenFramework.package,
      },
      {
        name: this.chosenBundler.name as string,
        description: PACKAGES_DESCRIPTIONS[this.chosenBundler.package],
        package: this.chosenBundler.package as string,
      },
    ]

    const storybookInfo = await this.ctx.storybook.loadStorybookInfo()
    const { storybookDep } = this.chosenFramework

    if (storybookInfo && storybookDep) {
      packages.push({
        name: storybookDep,
        description: PACKAGES_DESCRIPTIONS[storybookDep],
        package: storybookDep,
      })
    }

    return packages
  }

  get chosenTestingTypePluginsInitialized () {
    if (this.chosenTestingType === 'component' && this.ctx.currentProject?.ctPluginsInitialized) {
      return true
    }

    if (this.chosenTestingType === 'e2e' && this.ctx.currentProject?.e2ePluginsInitialized) {
      return true
    }

    return false
  }

  get canNavigateForward () {
    const data = this.ctx.wizardData

    if (data.currentStep === 'setupComplete') {
      return false
    }

    if (data.currentStep === 'selectFramework' && (!data.chosenBundler || !data.chosenFramework)) {
      return false
    }

    if (data.currentStep === 'initializePlugins') {
      if (data.chosenTestingType === 'component' && !this.ctx.currentProject?.ctPluginsInitialized) {
        return false
      }

      if (data.chosenTestingType === 'e2e' && !this.ctx.currentProject?.e2ePluginsInitialized) {
        return false
      }
    }

    // TODO: add constraints here to determine if we can move forward
    return true
  }

  async sampleCode () {
    const data = this.ctx.wizardData
    const storybookInfo = await this.ctx.storybook.loadStorybookInfo()

    if (!this.chosenLanguage) {
      return null
    }

    if (data.chosenTestingType === 'component') {
      if (!this.chosenFramework || !this.chosenBundler) {
        return null
      }

      return wizardGetConfigCodeCt({
        framework: this.chosenFramework,
        bundler: this.chosenBundler,
        lang: this.chosenLanguage,
        storybookInfo,
      })
    }

    if (this.chosenTestingType === 'e2e') {
      return wizardGetConfigCodeE2E({
        lang: this.chosenLanguage,
      })
    }

    return null
  }

  async sampleConfigFiles (): Promise<SampleConfigFile[]> {
    const testingType = this.chosenTestingType

    const configFileContent = await this.sampleCode()
    const templateFileContent = await this.sampleTemplate()

    if (!this.chosenLanguage || !configFileContent || !testingType) {
      return []
    }

    const sampleConfigFile: SampleConfigFile = {
      filePath: `cypress.config.${this.chosenLanguage.type}`,
      description: 'The config file you are supposed to have',
      content: configFileContent,
      status: 'changes',
      warningText: ['Please merge the code below with your existing',
        '<span class="rounded bg-warning-200 px-1 text-warning-600 inline-block">cypress.config.js</span>'].join(' '),
      warningLink: 'https://on.cypress.io/guides/configuration',
    }

    if (testingType === 'component' && templateFileContent) {
      const sampleTemplateFile: SampleConfigFile = {
        filePath: 'cypress/component/entry.html',
        content: templateFileContent,
        status: 'valid',
      }

      return [sampleConfigFile, ...(await getSampleConfigFiles(testingType, this.chosenLanguage.type)), sampleTemplateFile]
    }

    return [sampleConfigFile, ...(await getSampleConfigFiles(testingType, this.chosenLanguage.type))]
  }

  async sampleTemplate () {
    const storybookInfo = await this.ctx.storybook.loadStorybookInfo()

    if (!this.chosenFramework || !this.chosenBundler) {
      return null
    }

    return wizardGetComponentIndexHtml({
      bundler: this.chosenBundler,
      framework: this.chosenFramework,
      storybookInfo,
    })
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

  get chosenLanguage () {
    return CODE_LANGUAGES.find((f) => f.type === this.ctx.wizardData.chosenLanguage)
  }
}

interface GetCodeOptsE2E {
  lang: CodeLanguage
}

interface GetCodeOptsCt {
  framework: FrontendFramework
  bundler: Bundler
  lang: CodeLanguage
  storybookInfo?: StorybookInfo | null
}

export const wizardGetConfigCodeE2E = (opts: GetCodeOptsE2E): string | null => {
  const exportStatement =
    opts.lang.type === 'js' ? 'module.exports = {' : 'export default {'

  return `${exportStatement}
  e2e: {
    viewportHeight: 660,
    viewportWidth: 1000,
  }
}`
}

const wizardGetConfigCodeCt = (opts: GetCodeOptsCt): string | null => {
  const { framework, bundler, lang } = opts

  const comments = `Component testing, ${opts.lang.name}, ${framework.name}, ${bundler.name}`
  const frameworkConfig = getFrameworkConfigFile(opts)

  if (frameworkConfig) {
    return `// ${comments}

${frameworkConfig[lang.type]}`
  }

  const exportStatement =
    lang.type === 'js' ? 'module.exports = {' : 'export default {'

  const importStatements =
    lang.type === 'js'
      ? ''
      : [
          `import { startDevServer } from \'${bundler.package}\'`,
          `import webpackConfig from './webpack.config'`,
          '',
      ].join('\n')

  const requireStatements =
    lang.type === 'ts'
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

const getFrameworkConfigFile = (opts: GetCodeOptsCt) => {
  return {
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
          async devServer (cypressConfig, devServerConfig) {
            let webpackConfig = await getWebpackConfig('modern', 'dev')

            return startDevServer({
              options,
              webpackConfig,
            })
          },
        }
      `,
      ts: dedent`
        import { defineConfig } from 'cypress'

        export default defineConfig({
          component: {
            testFiles: "**/*cy-spec.tsx",
            componentFolder: "src"
          }
        })
      `,
    },
    cra: {
      js: dedent`
        const { defineConfig } = require('cypress')

        module.exports = defineConfig({
          component: {
            testFiles: "**/*.cy.{js,jsx,ts,tsx}",
            componentFolder: "src"
          }
        })
      `,
      ts: dedent`
        import { defineConfig } from 'cypress'

        export default defineConfig({
          component: {
            testFiles: "**/*.cy.{js,jsx,ts,tsx}",
            componentFolder: "src"
          }
        })
      `,
    },
    vuecli: {
      js: dedent`
        const { defineConfig } = require('cypress')

        module.exports = defineConfig({
          component: {
            testFiles: "**/*.cy.{js,jsx,ts,tsx}",
            componentFolder: "src"
          }
        })
      `,
      ts: dedent`
        import { defineConfig } from 'cypress'

        export default defineConfig({
          component: {
            testFiles: "**/*.cy.{js,jsx,ts,tsx}",
            componentFolder: "src"
          }
        })
      `,
    },
  }[opts.framework.type as string]
}

export const wizardGetComponentIndexHtml = (opts: Omit<GetCodeOptsCt, 'lang' | 'type'>) => {
  const framework = opts.framework.type
  let headModifier = ''
  let bodyModifier = ''

  if (framework === 'nextjs') {
    headModifier += '<div id="__next_css__DO_NOT_USE__"></div>'
  }

  const previewHead = opts.storybookInfo?.files.find(({ name }) => name === 'preview-head.html')

  if (previewHead) {
    headModifier += previewHead.content
  }

  const previewBody = opts.storybookInfo?.files.find(({ name }) => name === 'preview-body.html')

  if (previewBody) {
    headModifier += previewBody.content
  }

  return getComponentTemplate({ headModifier, bodyModifier })
}

const getComponentTemplate = (opts: {headModifier: string, bodyModifier: string}) => {
  // TODO: Properly indent additions and strip newline if none
  return dedent`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>Components App</title>
        ${opts.headModifier}
      </head>
      <body>
        ${opts.bodyModifier}
        <div id="__cy_root"></div>
      </body>
    </html>`
}
