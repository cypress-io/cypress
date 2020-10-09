import _ from 'lodash'
import { computed, observable } from 'mobx'
import Runnable, { RunnableProps } from './runnable-model'
import TestModel, { TestProps, TestStatus } from '../test/test-model'
import { Node } from '../tree/node'

// export interface SuiteProps extends RunnableProps {
//   children: Array<SuiteProps | TestProps>
// }

export default class Suite extends Runnable implements Node {
  @observable children: Array<TestModel | Suite> = []
  type = 'suite'

  @computed get status (): TestStatus {
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

  @computed get _childStatuses () {
    return _.map(this.children, 'status')
  }

  @computed get hasRetried (): boolean {
    return _.some(this.children, (v) => v.hasRetried)
  }

  @computed get _anyChildrenFailed () {
    return _.some(this._childStatuses, (status) => {
      return status === 'failed'
    })
  }

  @computed get _allChildrenPassedOrPending () {
    return !this._childStatuses.length || _.every(this._childStatuses, (status) => {
      return status === 'passed' || status === 'pending'
    })
  }

  @computed get _allChildrenPending () {
    return !!this._childStatuses.length
            && _.every(this._childStatuses, (status) => {
              return status === 'pending'
            })
  }
}
