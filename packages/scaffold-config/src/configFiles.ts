import type { FRONTEND_FRAMEWORKS } from '@packages/types'
import dedent from 'dedent'

type FrameworkType = typeof FRONTEND_FRAMEWORKS[number]['type']
type Lang = `${'j'|'t'}s`

type ConfigMap = {
  [key in FrameworkType]: {
    [key in Lang]: string
  }
}

export const configFiles: ConfigMap = {
  cra: {
    js: dedent`
      const { defineConfig } = require('cypress')
      const { devServer } = require('@cypress/react/plugins/react-scripts')

      module.exports = defineConfig({
        'video': false,
        'viewportWidth': 500,
        'viewportHeight': 800,
        'experimentalFetchPolyfill': true,
        'component': {
          devServer,
        },
      })
  `,
  ts: dedent`
    import { defineConfig } from 'cypress'
    import { devServer } from '@cypress/react/plugins/react-scripts'

    export default defineConfig({
      component: {
        devServer,
      },
    })
  `
  },

  nextjs: {
    js: dedent`
    const { devServer } = require('@cypress/react/plugins/next')

    module.exports = {
      component: {
        devServer
      }
    }
    `,
    ts: dedent`
    import { defineConfig } from 'cypress'
    import { devServer } from '@cypress/react/plugins/next'

    export default defineConfig({
      component: {
        devServer,
      },
    })`
  },

  vuecli: {
    js: dedent`
    const { devServer } = require('@cypress/webpack-dev-server')
    const webpackConfig = require('@vue/cli-service/webpack.config')

    module.exports = {
      component: {
        devServer,
        devServerConfig: {
          webpackConfig
        }
      }
    }
    `,
    ts: dedent`
    import { defineConfig } from 'cypress'
    import { devServer } from '@cypress/webpack-dev-server'
    import webpackConfig from '@vue/cli-service/webpack.config'

    export default defineConfig({
      component: {
        devServer,
        devServerConfig: {
          webpackConfig
        }
      }
    })`
  },

  nuxtjs: {
    js: dedent`
    const { defineConfig } = require("cypress")
    const { devServer } = require("@cypress/webpack-dev-server")
    const { getWebpackConfig } = require("nuxt")

    module.exports = defineConfig({
      component: {
        async devServer(cypressDevServerConfig) {
          const webpackConfig = await getWebpackConfig()

          return devServer(cypressDevServerConfig, { webpackConfig })
        }
      }
    })
    `,
    ts: dedent`
    `
  }
}