export interface CommonModeOptions {
  invokedFromCli: boolean
  userNodePath?: string
  userNodeVersion?: string
}

export interface RunModeOptions extends CommonModeOptions {
  _?: (null)[] | null
  runProject: string
  cwd: string
  testingType?: string
  config: Partial<Cypress.ConfigOptions>
  projectRoot: string
  headless?: boolean | null
  headed?: boolean | null
  spec?: (string)[] | null
  isTextTerminal?: boolean | null
  key?: string | null
  record?: boolean | null
  browser?: string | null
  configFile?: boolean | string
  group?: string | null
  parallel?: boolean | null
  ciBuildId?: string | null
  tag?: (string)[] | null
}

export type TestingType = 'e2e' | 'component'

export interface OpenModeOptions extends CommonModeOptions {
  _?: (string | null)[] | null
  config: Partial<Cypress.ConfigOptions>
  cwd: string
  global?: boolean
  testingType?: TestingType
  updating?: boolean | null
  configFile?: string | null
}

export type AllModeOptions = RunModeOptions & OpenModeOptions

export type InitializeProjectOptions = Partial<AllModeOptions> & {
  projectRoot: string
  testingType: TestingType
}
