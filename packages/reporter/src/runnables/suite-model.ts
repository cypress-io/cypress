import _ from 'lodash'
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
  @observable children: Array<TestModel | Suite> = []
  type = 'suite'

  constructor (props: SuiteProps, level: number) {
    super(props, level)

    makeObservable(this)
  }

  @computed get state (): TestState {
    if (this._anyChildrenFailed) {
      return 'failed'
    }

    if (this._allChildrenPending) {
      return 'pending'
    }

    if (this._allChildrenPassedOrPending) {
      return 'passed'
    }

    return 'processing'
  }

  @computed get _childStates () {
    return _.map(this.children, 'state')
  }

  @computed get hasRetried (): boolean {
    return _.some(this.children, (v) => v.hasRetried)
  }

  @computed get _anyChildrenFailed () {
    return _.some(this._childStates, (state) => {
      return state === 'failed'
    })
  }

  @computed get _allChildrenPassedOrPending () {
    return !this._childStates.length || _.every(this._childStates, (state) => {
      return state === 'passed' || state === 'pending'
    })
  }

  @computed get _allChildrenPending () {
    return !!this._childStates.length
            && _.every(this._childStates, (state) => {
              return state === 'pending'
            })
  }
}
