import type { FoundBrowser } from '@packages/types'
import { ChildProcess, spawn, SpawnOptions } from 'child_process'
import Debug from 'debug'

export const debug = Debug('cypress:launcher:browsers')

export abstract class Platform {
  launch (browser: FoundBrowser, url: string, args: string[], env: Record<string, string> = {}): ChildProcess {
    debug('launching browser %o', { browser, url, args, env })

    const proc = spawn(browser.path, [url, ...args], {
      ...Platform.defaultSpawnOpts,
      env: {
        ...Platform.defaultSpawnOpts.env,
        ...env,
      },
    })

    this.addDebugListeners(proc, browser)

    return proc
  }

  protected addDebugListeners (proc: ChildProcess, browser: FoundBrowser) {
    proc.stdout?.on('data', (buf) => {
      debug('%s stdout: %s', browser.name, String(buf).trim())
    })

    proc.stderr?.on('data', (buf) => {
      debug('%s stderr: %s', browser.name, String(buf).trim())
    })

    proc.on('exit', (code, signal) => {
      debug('%s exited: %o', browser.name, { code, signal })
    })
  }

  static get defaultSpawnOpts (): SpawnOptions {
    return {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
      },
    }
  }
}
