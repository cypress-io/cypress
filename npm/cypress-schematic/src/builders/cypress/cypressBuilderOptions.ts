import { JsonObject } from '@angular-devkit/core'

export interface CypressBuilderOptions extends JsonObject {
  baseUrl: string
  configFile: string | false
  browser: 'electron' | 'chrome' | 'chromium' | 'canary' | 'firefox' | string
  devServerTarget: string
  env: Record<string, string>
  quiet: boolean
  exit: boolean
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
}
