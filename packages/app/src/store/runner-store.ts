import { BaseStore } from '@packages/runner-shared/src/store'

export class MobxRunnerStore extends BaseStore { }

export let mobxRunnerStore

export const createMobxRunnerStore = () => {
  mobxRunnerStore = new MobxRunnerStore()

  return mobxRunnerStore
}

mobxRunnerStore = createMobxRunnerStore
