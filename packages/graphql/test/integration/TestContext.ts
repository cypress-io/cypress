import { BaseActions, BaseContext } from '../../src'
import { Project, Wizard } from '../../src/entities'
import { TestActions } from './TestActions'

interface TestContextInjectionOptions {
  wizard?: Wizard
}

export class TestContext extends BaseContext {
  localProjects: Project[] = []
  readonly actions: BaseActions
  viewer = null

  constructor ({ wizard }: TestContextInjectionOptions = {}) {
    super()
    this.actions = new TestActions(this)
    if (wizard) {
      this.wizard = wizard
    }
  }
}
