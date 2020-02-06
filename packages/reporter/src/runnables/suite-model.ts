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

  @computed get _anyChildrenFailed () {
    return _.some(this.children, ({ state }) => {
      return state === 'failed'
    })
  }

  @computed get _allChildrenPassedOrPending () {
    return !this.children.length || _.every(this.children, ({ state }) => {
      return state === 'passed' || state === 'pending'
    })
  }

  @computed get _allChildrenPending () {
    return (
      !!this.children.length &&
      _.every(this.children, ({ state }) => {
        return state === 'pending'
      })
    )
  }

  matchesFilter (filter: TestState | null): boolean {
    if (!filter || !this.children.length) return true

    return _.some(this.children, (child) => {
      return child.matchesFilter(filter)
    })
  }
}
