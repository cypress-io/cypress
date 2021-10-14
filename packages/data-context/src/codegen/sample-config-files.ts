import type { NexusGenEnums } from '@packages/graphql/src/gen/nxs.gen'
import type { SampleConfigFile } from '@packages/types'

// FIXME: temporary content
const content = `import { defineConfig } from ’cypress'
import { devServer, defineDevServerConfig } from ’@cypress/vite-dev-server’

// sample code !!!

export default defineConfig({
  component: {
    devServer,
    devServerConfig: defineDevServerConfig({
      entryHtmlFile: 'cypress/component/support/entry.html'
    }),
  },
})`

export async function getSampleConfigFiles (testingType: NexusGenEnums['TestingTypeEnum'], language: NexusGenEnums['CodeLanguageEnum']): Promise<SampleConfigFile[]> {
  const filePaths = [
    'cypress/fixtures/example.json',
    `cypress/integration/support.${language}`,
    `cypress/integration/commands.${language}`,
  ]

  return filePaths.map((filePath) => {
    return {
      filePath,
      content,
      status: 'valid',
      description: 'Aenean lacinia bibendum nulla sed consectetur.',
    }
  })
}
