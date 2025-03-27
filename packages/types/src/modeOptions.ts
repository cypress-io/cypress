export interface CommonModeOptions {
  _?: (string | null)[] | null
  invokedFromCli: boolean
  userNodePath?: string
  userNodeVersion?: string
  configFile?: string | null
}

export interface RunModeOptions extends CommonModeOptions {
  runProject?: string
  project?: string
  cwd: string
  testingType?: TestingType
  config: Partial<Cypress.ConfigOptions>
  projectRoot: string
  headless?: boolean | null
  headed?: boolean | null
  spec?: (string)[] | null
  isTextTerminal?: boolean | null
  key?: string | null
  record?: boolean | null
  browser?: string | null
  group?: string | null
  parallel?: boolean | null
  ciBuildId?: string | null
  tag?: (string)[] | null
  isBrowserGivenByCli: boolean
}

export type TestingType = 'e2e' | 'component'

export interface OpenModeOptions extends CommonModeOptions {
  config: Partial<Cypress.ConfigOptions>
  cwd: string
  global?: boolean
  testingType?: TestingType
  updating?: boolean | null
}

export type AllModeOptions = RunModeOptions & OpenModeOptions

export type InitializeProjectOptions = Partial<AllModeOptions> & {
  projectRoot: string
  testingType: TestingType
}
