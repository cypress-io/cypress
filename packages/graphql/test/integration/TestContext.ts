import { LaunchArgs, OpenProjectLaunchOptions } from '@packages/types'
import { BaseActions, BaseContext } from '../../src'
import { Project, Wizard } from '../../src/entities'
import { remoteSchema } from '../../src/stitching/remoteSchema'
import { TestActions } from './TestActions'

interface TestContextInjectionOptions {
  wizard?: Wizard
  launchArgs?: LaunchArgs
  launchOptions?: OpenProjectLaunchOptions
  Actions?: typeof TestActions
}

export class TestContext extends BaseContext {
  _remoteSchema = remoteSchema

  localProjects: Project[] = []
  readonly actions: BaseActions
  viewer = null

  constructor ({ wizard, launchArgs, launchOptions, Actions }: TestContextInjectionOptions = {}) {
    super(launchArgs || {
      config: {},
      cwd: '/current/working/dir',
      _: ['/current/working/dir'],
      projectRoot: '/project/root',
      invokedFromCli: false,
      browser: null,
      global: false,
      testingType: 'e2e',
      project: '/project/root',
      os: 'linux',
    }, launchOptions || {})

    this.actions = Actions ? new Actions(this) : new TestActions(this)
    if (wizard) {
      this.wizard = wizard
    }
  }
}
