import _ from 'lodash'
import { computed, observable, makeObservable } from 'mobx'
import Runnable, { RunnableProps } from './runnable-model'
import TestModel, { TestProps, TestState } from '../test/test-model'

export interface SuiteProps extends RunnableProps {
  suites: Array<SuiteProps>
  tests: Array<TestProps>
}

export default class Suite extends Runnable {
  children: Array<TestModel | Suite> = [];
  type = 'suite'

  constructor (props: RunnableProps, level: number) {
    super(props, level)

    makeObservable(this, {
      children: observable,
      state: computed,
      _childStates: computed,
      hasRetried: computed,
      _anyChildrenFailed: computed,
      _allChildrenPassedOrPending: computed,
      _allChildrenPending: computed,
    })
  }

  get state (): TestState {
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

  get _childStates () {
    return _.map(this.children, 'state')
  }

  get hasRetried (): boolean {
    return _.some(this.children, (v) => v.hasRetried)
  }

  get _anyChildrenFailed () {
    return _.some(this._childStates, (state) => {
      return state === 'failed'
    })
  }

  get _allChildrenPassedOrPending () {
    return !this._childStates.length || _.every(this._childStates, (state) => {
      return state === 'passed' || state === 'pending'
    })
  }

  get _allChildrenPending () {
    return !!this._childStates.length
            && _.every(this._childStates, (state) => {
              return state === 'pending'
            })
  }
}
