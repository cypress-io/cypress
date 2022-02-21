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
  }
}