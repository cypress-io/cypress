import type { Bundler, CodeLanguage, FrontendFramework, StorybookInfo } from '@packages/types'
import dedent from 'dedent'

interface GetCodeOptsE2E {
    lang: CodeLanguage
}

export interface GetCodeOptsCt {
    framework: FrontendFramework
    bundler: Bundler
    lang: CodeLanguage
    storybookInfo?: StorybookInfo | null
}

export const wizardGetConfigCodeE2E = (opts: GetCodeOptsE2E): string | null => {
  const exportStatement =
      opts.lang.type === 'js' ? 'module.exports = {' : 'export default {'

  return `${exportStatement}{
    e2e: {
      viewportHeight: 660,
      viewportWidth: 1000,
    }
  }`
}

export const wizardGetConfigCodeCt = (opts: GetCodeOptsCt): string | null => {
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

  return dedent`// ${comments}
  ${importStatements}
  ${exportStatement}
    ${requireStatements}component(on, config) {
      on('dev-server:start', (options) => {
        ${startServerReturn}
      })
    }
  }`
}

export const getFrameworkConfigFile = (opts: GetCodeOptsCt) => {
  const frameworkType = opts.framework.type

  if (frameworkType === 'react' || frameworkType === 'vue') {
    return undefined
  }

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
              testFiles: "**/*cy-spec.{js,jsx,ts,tsx}",
              componentFolder: "src"
            }
          })
        `,
      ts: dedent`
          import { defineConfig } from 'cypress'
  
          export default defineConfig({
            component: {
              testFiles: "**/*cy-spec.{js,jsx,ts,tsx}",
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
              testFiles: "**/*cy-spec.{js,jsx,ts,tsx}",
              componentFolder: "src"
            }
          })
        `,
      ts: dedent`
          import { defineConfig } from 'cypress'
  
          export default defineConfig({
            component: {
              testFiles: "**/*cy-spec.{js,jsx,ts,tsx}",
              componentFolder: "src"
            }
          })
        `,
    },
  }[frameworkType]
}
