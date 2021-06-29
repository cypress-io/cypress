import browsers from './browsers'

export interface UnifiedProjectConstructor {
  cwd: string
  projectRoot: string
}

export type RunnerType = 'ct' | 'e2e'

export function prelaunchCt () {
}

export class UnifiedProject {
  // private projectRoot: string
  // private cwd: string

  // constructor({ projectRoot, cwd }: UnifiedProjectConstructor) {
  // this.projectRoot = projectRoot
  // this.cwd = cwd
  // }

  /**
   * perform runner-specific pre-launch behavior, such as
   * starting a dev-server for CT.
   */
  prelaunch ({ runner }: { runner: RunnerType }) {
    if (runner === 'ct') {
      return prelaunchCt()
      //
    }
  }

  /**
   * launches a runner - either E2E or  CT
   */
  launch ({ type }: { type: RunnerType }) {
    const chrome = {
      displayName: 'Chrome',
      name: 'chrome',
      family: 'chromium',
      channel: 'stable',
      version: '91.0.4472.114',
      path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      profilePath: undefined,
      majorVersion: 91,
      info: undefined,
      custom: undefined,
      warning: undefined,
      isChosen: true,
      isHeaded: true,
      isHeadless: false,
    }

    browsers.open(chrome, {}, {})
  }
}
