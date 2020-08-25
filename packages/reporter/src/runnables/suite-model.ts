import _ from 'lodash'
import { computed, observable } from 'mobx'
import Runnable, { RunnableProps } from './runnable-model'
import TestModel, { TestProps, TestState } from '../test/test-model'

export interface SuiteProps extends RunnableProps {
  suites: Array<SuiteProps>
  tests: Array<TestProps>
}

export default class Suite extends Runnable {
  @observable children: Array<TestModel | Suite> = []
  type = 'suite'

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
