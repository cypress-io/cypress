import _ from 'lodash'
import { computed, observable } from 'mobx'
import Runnable from './runnable-model'

type TestState = 'active' | 'failed' | 'pending' | 'passed' | 'processing'

export interface Children {
  state: TestState
}

export default class Suite extends Runnable {
  @observable children: Array<Children> = []
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
