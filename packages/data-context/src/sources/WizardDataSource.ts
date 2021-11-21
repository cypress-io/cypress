import { Bundler, BUNDLERS, CodeLanguage, CODE_LANGUAGES, FrontendFramework, FRONTEND_FRAMEWORKS, SampleConfigFile, StorybookInfo } from '@packages/types'
import type { DataContext } from '..'
import { getSampleConfigFiles } from '../codegen/sample-config-files'
import dedent from 'dedent'
import type { WizardSetupInput } from '@packages/graphql/src/gen/nxs.gen'

export class WizardDataSource {
  constructor (private ctx: DataContext) {}

  private inputData (input: WizardSetupInput) {
    return {
      bundler: BUNDLERS.find((b) => b.type === input.bundler),
      framework: FRONTEND_FRAMEWORKS.find((f) => f.type === input.framework),
      language: CODE_LANGUAGES.find((f) => f.type === input.language),
    }
  }

  async sampleCode (input: WizardSetupInput) {
    const storybookInfo = await this.ctx.storybook.loadStorybookInfo()
    const data = this.inputData(input)

    if (!data.language) {
      return null
    }

    if (this.currentTestingType === 'component') {
      if (!data.framework || !data.bundler) {
        return null
      }

      return wizardGetConfigCodeCt({
        framework: data.framework,
        bundler: data.bundler,
        lang: data.language,
        storybookInfo,
      })
    }

    if (this.currentTestingType === 'e2e') {
      return wizardGetConfigCodeE2E({
        lang: data.language,
      })
    }

    return null
  }

  async sampleConfigFiles (input: WizardSetupInput): Promise<SampleConfigFile[]> {
    const testingType = this.currentTestingType

    const data = this.inputData(input)
    const configFileContent = await this.sampleCode(input)
    const templateFileContent = await this.sampleTemplate(input)

    if (!data.language || !configFileContent || !testingType) {
      return []
    }

    const sampleConfigFile: SampleConfigFile = {
      filePath: `cypress.config.${input.language}`,
      description: 'The config file you are supposed to have',
      content: configFileContent,
      status: 'changes',
      warningText: ['Please merge the code below with your existing',
        '<span class="px-1 inline-block rounded bg-warning-200 text-warning-600">cypress.config.js</span>'].join(' '),
      warningLink: 'https://docs.cypress.io/config-file',
    }

    if (testingType === 'component' && templateFileContent) {
      const sampleTemplateFile: SampleConfigFile = {
        filePath: 'cypress/component/entry.html',
        content: templateFileContent,
        status: 'valid',
      }

      return [sampleConfigFile, ...(await getSampleConfigFiles(testingType, input.language)), sampleTemplateFile]
    }

    return [sampleConfigFile, ...(await getSampleConfigFiles(testingType, input.language))]
  }

  async sampleTemplate (input: WizardSetupInput) {
    const data = this.inputData(input)
    const storybookInfo = await this.ctx.storybook.loadStorybookInfo()

    if (!data.framework || !data.bundler) {
      return null
    }

    return wizardGetComponentIndexHtml({
      bundler: data.bundler,
      framework: data.framework,
      storybookInfo,
    })
  }

  private get currentTestingType () {
    return this.ctx.currentProject?.currentTestingType ?? null
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
