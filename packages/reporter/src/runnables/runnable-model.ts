import { observable } from 'mobx'
import { HookProps } from '../hooks/hook-model'
import SuiteModel, { SuiteProps } from './suite-model'

export interface RunnableProps {
  id: string
  title?: string
  hooks: Array<HookProps>
  parents: Array<String>
  suites: Array<SuiteModel>
}

export default class Runnable {
  @observable id: string
  @observable title?: string
  @observable level: number
  @observable hooks: Array<HookProps> = []
  @observable parents: Array<String> = []
  @observable suites: Array<SuiteModel> = []

  constructor (props: RunnableProps, level: number) {
    this.id = props.id
    this.parents = props.parents
    this.suites = props.suites
    this.title = props.title
    this.level = level
    this.hooks = props.hooks
  }
}
