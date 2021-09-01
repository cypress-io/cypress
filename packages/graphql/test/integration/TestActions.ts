import type { FoundBrowser } from '@packages/launcher'
import { BaseActions, BaseContext, Project } from '../../src'

export class TestActions extends BaseActions {
  ctx: BaseContext

  constructor (_ctx: BaseContext) {
    super(_ctx)
    this.ctx = _ctx
  }

  installDependencies () {}
  createConfigFile () {}

  initializeOpenProject () {
    return null
  }

  resolveOpenProjectConfig () {
    return null
  }

  addProject (projectRoot: string) {
    return new Project(projectRoot, this.ctx)
  }

  async launchOpenProject () {}

  async authenticate () {
    this.ctx.setAuthenticatedUser({
      authToken: 'test-auth-token',
      email: 'test@cypress.io',
      name: 'cypress test',
    })
  }

  async logout () {
    this.ctx.setAuthenticatedUser(null)
  }

  async getProjectId () {
    return 'test-project-id'
  }
  async getRuns () {
    return []
  }
  async getRecordKeys () {
    return []
  }

  async getBrowsers () {
    const browser: FoundBrowser = {
      displayName: 'chrome',
      family: 'chromium',
      majorVersion: '1.0.0',
      name: 'chrome',
      channel: 'dev',
      version: '1.0.0',
      path: '/dev/chrome',
    }

    return [browser]
  }

  async initializeConfig () {}
}

// export class TestActions extends BaseActions {
//   ctx: BaseContext

//   constructor (_ctx: BaseContext) {
//     super(_ctx)
//     this.ctx = _ctx
//   }

//   installDependencies () {}
//   createConfigFile () {}

//   async launchOpenProject () {}
//   resolveOpenProjectConfig (): FullConfig {
//     return {
//       projectRoot: '/root/path',
//       resolved: {},
//     }
//   }

//   addProject (projectRoot: string) {
//     return new LocalProject(projectRoot, this.ctx)
//   }

//   async authenticate () {
//     this.ctx.viewer = new Viewer(this.ctx, {
//       authToken: 'test-auth-token',
//       email: 'test@cypress.io',
//       name: 'cypress test',
//     })
//   }

//   async logout () {
//     this.ctx.viewer = null
//   }

//   async getProjectId () {
//     return 'test-project-id'
//   }
//   async getRuns () {
//     return []
//   }
//   async getRecordKeys () {
//     return []
//   }

//   async initializeOpenProject () {}

//   async getBrowsers () {
//     const browser: FoundBrowser = {
//       displayName: 'chrome',
//       family: 'chromium',
//       majorVersion: '1.0.0',
//       name: 'chrome',
//       channel: 'dev',
//       version: '1.0.0',
//       path: '/dev/chrome',
//     }

//     return [browser]
//   }

//   async initializeConfig () {}
// }
