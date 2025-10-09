// this file is named XDarwin because intellisense gets confused with '../darwin/'
import { ChildProcess, spawn } from 'child_process'
import { Platform } from './Platform'
import type { FoundBrowser } from '@packages/types'
import os from 'os'

export class Darwin extends Platform {
  launch (browser: FoundBrowser, url: string, args: string[], env: Record<string, string> = {}): ChildProcess {
    if (os.arch() === 'arm64') {
      const proc = spawn(
        'arch',
        [browser.path, url, ...args], {
          ...Platform.defaultSpawnOpts,
          env: {
            ARCHPREFERENCE: 'arm64,x86_64',
            ...Platform.defaultSpawnOpts.env,
            ...env,
          },
        },
      )

      this.addDebugListeners(proc, browser)

      return proc
    }

    return super.launch(browser, url, args, env)
  }
}
