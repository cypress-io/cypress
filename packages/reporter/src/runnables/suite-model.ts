import { computed, observable, makeObservable } from 'mobx'
import Runnable, { RunnableProps } from './runnable-model'
import type TestModel from '../test/test-model'
import type { TestProps } from '../test/test-model'
import type { TestState } from '@packages/types'

export interface SuiteProps extends RunnableProps {
  suites: Array<SuiteProps>
  tests: Array<TestProps>
}

export default class Suite extends Runnable {
  children: Array<TestModel | Suite> = []
  type = 'suite'

  constructor (props: SuiteProps, level: number) {
    super(props, level)

    makeObservable(this, {
      children: observable,
      state: computed,
      _testChildStates: computed,
      hasRetried: computed,
      _anyTestChildrenFailed: computed,
      _allTestChildrenPassedOrPending: computed,
      _allTestChildrenPending: computed,
      _anyTestChildrenRunning: computed,
    })
  }

  get state (): TestState {
    // TODO https://github.com/cypress-io/cypress-services/issues/11050
    // if (this._anyTestChildrenRunning) {
    //   return 'active'
    // }

    if (this._anyTestChildrenFailed) {
      return 'failed'
    }

    if (this._allTestChildrenPending) {
      return 'pending'
    }

    if (this._allTestChildrenPassedOrPending) {
      return 'passed'
    }

    return 'processing'
  }

  get _testChildren () {
    return this.children.filter((child) => child.type === 'test')
  }

  get _testChildStates () {
    /**
     * since we're displaying a collapsible for each suite whether it's a nested suite or not,
     * we only want to consider the test children of the current suite and not the state of any suite children
     */
    return this._testChildren.map((t) => t.state)
  }

  get hasRetried (): boolean {
    return this._testChildren.some((v) => v.hasRetried)
  }

  get _anyTestChildrenRunning () {
    return this._testChildStates.some((state) => {
      return state === 'active'
    })
  }

  get _anyTestChildrenFailed () {
    return this._testChildStates.some((state) => {
      return state === 'failed'
    })
  }

  get _allTestChildrenPassedOrPending () {
    return !this._testChildStates.length || this._testChildStates.every((state) => {
      return state === 'passed' || state === 'pending'
    })
  }

  get _allTestChildrenPending () {
    return !!this._testChildStates.length
            && this._testChildStates.every((state) => {
              return state === 'pending'
            })
  }
}
