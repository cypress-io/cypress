import type { NexusGenEnums } from '@packages/graphql/src/gen/nxs.gen'
import type { SampleConfigFile } from '@packages/types'

// FIXME: temporary content
const content = `const { defineConfig } = require(’cypress’)
const { devServer, defineDevServerConfig } = require(’@cypress/vite-dev-server’)    

module.exports = defineConfig({
  component: {
    devServer,
    devServerConfig: defineDevServerConfig({
      entryHtmlFile: 'cypress/component/support/entry.html'
    }),
  },
})`

export async function getSampleConfigFiles (testingType: NexusGenEnums['TestingTypeEnum'], language: NexusGenEnums['CodeLanguageEnum']): Promise<SampleConfigFile[]> {
  const filePaths = testingType === 'component' ? [
    'cypress/fixtures/example.json',
    `cypress/component/support.${language}`,
    `cypress/component/commands.${language}`,
    'cypress/component/entry.html',
  ] : [
    'cypress/fixtures/example.json',
    `cypress/integration/support.${language}`,
    `cypress/integration/commands.${language}`,
  ]

  return filePaths.map((filePath) => {
    return {
      filePath,
      content,
      status: 'valid',
    }
  })
}
