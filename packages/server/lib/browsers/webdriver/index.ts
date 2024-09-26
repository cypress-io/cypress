import type { SpawnOptionsWithoutStdio, SpawnOptionsWithStdioTuple, StdioNull, StdioPipe } from 'child_process'
import type WebDriverPackage from 'webdriver'

const webDriverPackageName = 'webdriver'

type StdioOption = StdioNull | StdioPipe

export type GeckoDriverOptions = {
  allowHosts?: string[]
  allowOrigins?: string[]
  binary?: string
  connectExisting?: boolean
  host?: string
  jsdebugger?: boolean
  log?: 'fatal' | 'error' | 'warn' | 'info' | 'config' | 'debug' | 'trace'
  logNoTruncate?: boolean
  marionetteHost?: string
  marionettePort?: number
  port?: number
  websocketPort?: number
  profileRoot?: string
  geckoDriverVersion?: string
  customGeckoDriverPath?: string
  cacheDir?: string
  spawnOpts: SpawnOptionsWithoutStdio | SpawnOptionsWithStdioTuple<StdioOption, StdioOption, StdioOption>
}

export class WebDriver {
  // We resolve this package in such a way to packherd can discover it.
  static getWebDriverPackage: () => typeof WebDriverPackage = () => {
    /**
     * NOTE: webdriver is an ESM package and does not play well with mksnapshot.
     * Requiring the package in this way, dynamically, will
     * make it undiscoverable by mksnapshot
     */
    return require(require.resolve(webDriverPackageName, { paths: [__dirname] }))
  }
}
