import _ from 'lodash'
import { computed, observable } from 'mobx'
import Runnable, { RunnableProps } from './runnable-model'
import Test, { TestProps, TestState } from '../test/test-model'

export interface SuiteProps extends RunnableProps {
  tests: Array<Test>
}

export default class Suite extends Runnable {
  // @observable children: Array<TestModel | Suite> = []
  @observable tests: Array<Test> = []
  type = 'suite'

  constructor (props: SuiteProps, level: number) {
    super(props, level)

    this.tests = props.tests
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

  @computed get displayTitle () {
    return this.parents.concat(this.title || '').filter((opt) => opt !== '').join(' > ')
  }

  @computed get _children (): Array<Suite | Test> {
    return [...this.suites, ...this.tests]
  }

  @computed get _childStates () {
    return _.map(this._children, 'state')

    // return _.map(this.tests, 'state').concat(this.suites)
  }

  @computed get hasRetried (): boolean {
    return _.some(this._children, (v) => v.hasRetried)
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
