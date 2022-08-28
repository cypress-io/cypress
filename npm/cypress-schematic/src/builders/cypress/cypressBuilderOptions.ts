import { JsonObject } from '@angular-devkit/core'

export interface CypressBuilderOptions extends JsonObject {
  baseUrl: string
  configFile: string
  browser: 'electron' | 'chrome' | 'chromium' | 'canary' | 'firefox' | 'edge' | string
  devServerTarget: string
  e2e: boolean
  component: boolean
  env: Record<string, string>
  quiet: boolean
  exit: boolean
  headed: boolean
  headless: boolean
  key: string
  parallel: boolean
  projectPath: string
  record: boolean
  reporter: string
  reporterOptions: JsonObject
  spec: string
  tsConfig: string
  watch: boolean
  testingType: 'e2e' | 'component'
}
