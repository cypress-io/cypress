export interface Args {
  cwd: string
  force?: boolean
  fixtures?: boolean
  fixturesPath?: string
  support?: boolean
  supportPath?: string
  plugins?: boolean
  pluginsPath?: string
  integrationPath?: string
  video?: boolean
  example?: boolean
  typescript?: boolean
  eslint?: boolean
  chaiFriendly?: boolean
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
  eslint?: boolean
  chaiFriendly?: boolean
}
