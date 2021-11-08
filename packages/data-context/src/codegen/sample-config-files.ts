import type { NexusGenEnums } from '@packages/graphql/src/gen/nxs.gen'
import type { SampleConfigFile } from '@packages/types'

// FIXME: temporary content
const content = `import { defineConfig } from 'cypress'
import { devServer } from '@cypress/vite-dev-server'

// sample code !!!

export default defineConfig({
  component: {
    devServer,
    devServerConfig: {
      entryHtmlFile: 'cypress/component/support/entry.html'
    },
  },
})`

export async function getSampleConfigFiles (testingType: NexusGenEnums['TestingTypeEnum'], language: NexusGenEnums['CodeLanguageEnum']): Promise<SampleConfigFile[]> {
  const testingTypeFolder = { e2e: 'integration', component: 'component' }[testingType]
  const filePaths = [
    `cypress/${testingTypeFolder}/support.${language}`,
    `cypress/${testingTypeFolder}/commands.${language}`,
    'cypress/fixtures/example.json',
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
