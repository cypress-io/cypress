export interface Args {
  cwd: string
  force?: boolean
  noFixtures?: boolean
  fixturesPath?: string
  noSupport?: boolean
  supportPath?: string
  noPlugins?: boolean
  pluginsPath?: string
  integrationPath?: string
  noVideo?: boolean
  example?: boolean
  typescript?: boolean
}

export interface Config {
  fixturesFolder?: string | false
  supportFile?: string | false
  pluginsFile?: string | false
  integrationFolder?: string
  video?: boolean
}

export interface InitConfig {
  config: Config
  example?: boolean
  typescript?: boolean
}
