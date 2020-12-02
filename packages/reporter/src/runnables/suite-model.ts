import _ from 'lodash'
import { computed, observable } from 'mobx'

import { RunnableModel } from './runnable-model'
import { TestModel, TestState } from '../test/test-model'
import { VirtualizableType } from '../tree/virtualizable-types'
import { VirtualNodeModel } from '../tree/virtual-node-model'

export class SuiteModel extends RunnableModel {
  type = 'suite'
  virtualType = VirtualizableType.Suite

  @observable children: Array<TestModel | SuiteModel> = []
  @observable virtualNode: VirtualNodeModel

  constructor (props: RunnableModel, level: number) {
    super(props, level)

    this.virtualNode = new VirtualNodeModel(this.id, this.virtualType)
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
